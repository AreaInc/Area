import {
  Controller,
  Post,
  Body,
  Headers,
  BadRequestException,
  Inject,
} from "@nestjs/common";
import { Public } from "../decorators/public.decorator";
import { WorkflowsService } from "../../services/workflows/workflows.service";
import { ReceiveEmailTrigger } from "../../services/gmail/triggers/receive-email.trigger";
import { GmailClient } from "../../services/gmail/gmail-client";
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from "@nestjs/swagger";
import {
  GmailWebhookPayloadDto,
  GmailWebhookResponseDto,
  TestWebhookPayloadDto,
} from "../dtos";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { DRIZZLE } from "../../db/drizzle.module";
import * as schema from "../../db/schema";
import { workflows, credentials } from "../../db/schema";
import { eq, and } from "drizzle-orm";

@ApiTags("Gmail Webhooks")
@Controller("api/webhooks/gmail")
export class GmailWebhookController {
  constructor(
    private readonly workflowsService: WorkflowsService,
    private readonly receiveEmailTrigger: ReceiveEmailTrigger,
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  @Post("receive")
  @Public()
  @ApiOperation({
    summary: "Receive Gmail webhook notification",
    description:
      "Receives Gmail push notifications for new emails. This endpoint is called by Google's Pub/Sub service when a new email arrives. It finds all matching active workflows and triggers their execution via Temporal. This endpoint is public and does not require authentication.",
  })
  @ApiBody({ type: GmailWebhookPayloadDto })
  @ApiResponse({
    status: 200,
    description: "Webhook processed successfully",
    type: GmailWebhookResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      "Invalid webhook payload - missing required fields (messageId, from, to, subject)",
  })
  async receiveEmail(@Body() payload: GmailWebhookPayloadDto) {
    if (
      !payload.messageId ||
      !payload.from ||
      !payload.to ||
      !payload.subject
    ) {
      throw new BadRequestException(
        "Invalid payload: messageId, from, to, and subject are required",
      );
    }

    console.log("[GmailWebhook] Received email notification:", {
      messageId: payload.messageId,
      from: payload.from,
      subject: payload.subject,
    });

    const matchingWorkflows = this.receiveEmailTrigger.getMatchingWorkflows({
      messageId: payload.messageId,
      from: payload.from,
      to: payload.to,
      subject: payload.subject,
    });

    console.log(
      `[GmailWebhook] Found ${matchingWorkflows.length} matching workflows`,
    );

    const results = await Promise.allSettled(
      matchingWorkflows.map((workflowId) =>
        this.workflowsService.triggerWorkflowExecution(workflowId, {
          messageId: payload.messageId,
          threadId: payload.threadId || "",
          from: payload.from,
          to: payload.to,
          subject: payload.subject,
          body: payload.body || "",
          htmlBody: payload.htmlBody || "",
          date: payload.date || new Date().toISOString(),
          attachments: payload.attachments || [],
        }),
      ),
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    console.log(
      `[GmailWebhook] Triggered ${successful} workflows successfully, ${failed} failed`,
    );

    return {
      success: true,
      triggered: successful,
      failed,
      totalWorkflows: matchingWorkflows.length,
    };
  }

  @Post("pubsub")
  @Public()
  @ApiOperation({
    summary: "Receive Gmail Pub/Sub notification",
    description:
      "Receives Gmail push notifications from Google Cloud Pub/Sub. This endpoint handles the Pub/Sub message format, extracts email information, and triggers matching workflows. This endpoint is public and does not require authentication.",
  })
  @ApiResponse({
    status: 200,
    description: "Pub/Sub notification processed successfully",
  })
  async receivePubSubNotification(@Body() body: any) {
    try {
      // Pub/Sub sends messages in this format:
      // {
      //   "message": {
      //     "data": "base64-encoded-string",
      //     "messageId": "...",
      //     "publishTime": "..."
      //   },
      //   "subscription": "..."
      // }

      if (!body.message || !body.message.data) {
        throw new BadRequestException(
          "Invalid Pub/Sub message format: missing message.data",
        );
      }

      // Decode base64 data
      const decodedData = Buffer.from(body.message.data, "base64").toString(
        "utf-8",
      );
      const pubSubData = JSON.parse(decodedData);

      // Pub/Sub data contains emailAddress and historyId
      const emailAddress = pubSubData.emailAddress;
      const historyId = pubSubData.historyId;

      if (!emailAddress || !historyId) {
        console.warn(
          "[GmailWebhook] Pub/Sub message missing emailAddress or historyId",
          pubSubData,
        );
        return { success: true, message: "Notification received but incomplete" };
      }

      // Find workflows for this email address
      const [workflow] = await this.db
        .select()
        .from(workflows)
        .where(
          and(
            eq(workflows.triggerProvider, "gmail"),
            eq(workflows.triggerId, "receive-email"),
            eq(workflows.isActive, true),
          ),
        )
        .limit(1);

      if (!workflow || !workflow.actionCredentialsId) {
        console.warn(
          `[GmailWebhook] No active workflow found for email ${emailAddress}`,
        );
        return { success: true, message: "No matching workflows" };
      }

      // Get credentials to fetch email details
      const [credential] = await this.db
        .select()
        .from(credentials)
        .where(eq(credentials.id, workflow.actionCredentialsId));

      if (!credential) {
        console.error(
          `[GmailWebhook] Credentials not found for workflow ${workflow.id}`,
        );
        return { success: false, error: "Credentials not found" };
      }

      // Create Gmail client and fetch new messages
      const gmailClient = new GmailClient({
        data: {
          accessToken: credential.accessToken || undefined,
          refreshToken: credential.refreshToken || undefined,
          expiresAt: credential.expiresAt
            ? new Date(credential.expiresAt).getTime()
            : undefined,
        },
      });

      // Get history to find new messages
      const gmail = await import("googleapis").then((m) => m.google);
      const oauth2Client = new gmail.auth.OAuth2(
        credential.clientId || undefined,
        credential.clientSecret || undefined,
      );
      oauth2Client.setCredentials({
        access_token: credential.accessToken || undefined,
        refresh_token: credential.refreshToken || undefined,
        expiry_date: credential.expiresAt
          ? new Date(credential.expiresAt).getTime()
          : undefined,
      });

      const gmailApi = gmail.gmail({ version: "v1", auth: oauth2Client });

      // Get history since last historyId
      const lastHistoryId = workflow.gmailHistoryId;
      if (lastHistoryId && historyId && historyId !== lastHistoryId) {
        try {
          const historyResponse = await gmailApi.users.history.list({
            userId: "me",
            startHistoryId: lastHistoryId,
            historyTypes: ["messageAdded"],
          });

          const history = historyResponse.data.history || [];
          const messageIds = new Set<string>();

          for (const historyItem of history) {
            if (historyItem.messagesAdded) {
              for (const messageAdded of historyItem.messagesAdded) {
                if (messageAdded.message?.id) {
                  messageIds.add(messageAdded.message.id);
                }
              }
            }
          }

          // Process each new message
          for (const messageId of messageIds) {
            try {
              const message = await gmailClient.getMessage(messageId);
              const details = gmailClient.getMessageDetails(message);

              // Trigger workflows with email data
              const matchingWorkflows =
                this.receiveEmailTrigger.getMatchingWorkflows({
                  messageId: details.id,
                  from: details.from,
                  to: details.to,
                  subject: details.subject,
                });

              await Promise.allSettled(
                matchingWorkflows.map((wfId) =>
                  this.workflowsService.triggerWorkflowExecution(wfId, {
                    messageId: details.id,
                    threadId: details.threadId,
                    from: details.from,
                    to: details.to,
                    subject: details.subject,
                    body: details.body,
                    htmlBody: details.htmlBody,
                    date: details.date,
                    attachments: details.attachments,
                  }),
                ),
              );
            } catch (error) {
              console.error(
                `[GmailWebhook] Error processing message ${messageId}:`,
                error,
              );
            }
          }

          // Update workflow with new historyId
          await this.db
            .update(workflows)
            .set({
              gmailHistoryId: historyId,
              updatedAt: new Date(),
            })
            .where(eq(workflows.id, workflow.id));
        } catch (error) {
          console.error(
            `[GmailWebhook] Error fetching history for workflow ${workflow.id}:`,
            error,
          );
        }
      }

      return { success: true, message: "Pub/Sub notification processed" };
    } catch (error: any) {
      console.error("[GmailWebhook] Error processing Pub/Sub notification:", error);
      return {
        success: false,
        error: error?.message || "Failed to process notification",
      };
    }
  }

  @Post("test")
  @Public()
  @ApiOperation({
    summary: "Test Gmail webhook with sample data",
    description:
      "Test endpoint for simulating Gmail webhook notifications. Useful for testing workflows without waiting for actual emails. All fields are optional - defaults will be used if not provided.",
  })
  @ApiBody({ type: TestWebhookPayloadDto, required: false })
  @ApiResponse({
    status: 200,
    description: "Test webhook processed successfully",
    type: GmailWebhookResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Invalid webhook payload",
  })
  async testWebhook(@Body() payload?: TestWebhookPayloadDto) {
    const testEmail = {
      messageId: `test-${Date.now()}`,
      threadId: `thread-${Date.now()}`,
      from: payload?.from || "test@example.com",
      to: payload?.to || "user@example.com",
      subject: payload?.subject || "Test Email",
      body:
        payload?.body || "This is a test email from the webhook test endpoint.",
      date: new Date().toISOString(),
    };

    return this.receiveEmail(testEmail);
  }
}
