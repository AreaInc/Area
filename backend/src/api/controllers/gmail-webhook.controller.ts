import {
  Controller,
  Post,
  Body,
  Headers,
  BadRequestException,
} from "@nestjs/common";
import { Public } from "../decorators/public.decorator";
import { WorkflowsService } from "../../services/workflows/workflows.service";
import { ReceiveEmailTrigger } from "../../services/gmail/triggers/receive-email.trigger";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from "@nestjs/swagger";
import {
  GmailWebhookPayloadDto,
  GmailWebhookResponseDto,
  TestWebhookPayloadDto,
} from "../dtos";

@ApiTags("Gmail Webhooks")
@Controller("api/webhooks/gmail")
export class GmailWebhookController {
  constructor(
    private readonly workflowsService: WorkflowsService,
    private readonly receiveEmailTrigger: ReceiveEmailTrigger,
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
    description: "Invalid webhook payload - missing required fields (messageId, from, to, subject)",
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
