import {
  Controller,
  Post,
  Body,
  Headers,
  HttpException,
  HttpStatus,
  Query,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiQuery,
} from "@nestjs/swagger";
import { WorkflowTriggerRegistry } from "../../services/workflow-trigger-registry";
import { ServiceProvider } from "../../common/types/enums";
import { Public } from "../decorators/public.decorator";

interface GmailWebhookPayload {
  messageId: string;
  threadId?: string;
  from?: string;
  to?: string;
  subject?: string;
  body?: string;
  htmlBody?: string;
  date?: string;
  snippet?: string;
  attachments?: Array<{
    filename: string;
    mimeType: string;
    size: number;
    attachmentId: string;
  }>;
  userId?: string; // Optional: if you want to filter by user
}

@ApiTags("Webhooks")
@Controller("api/webhooks")
export class WebhooksController {
  constructor(private readonly triggerRegistry: WorkflowTriggerRegistry) {}

  @Post("gmail")
  @Public()
  @ApiOperation({
    summary: "Receive Gmail push notification webhook",
    description:
      "Endpoint for receiving Gmail push notifications. When a new email is received, " +
      "this will trigger all active workflows that have the 'receive_email' trigger node.",
  })
  @ApiBody({
    description: "Gmail webhook payload",
    schema: {
      type: "object",
      properties: {
        messageId: { type: "string" },
        threadId: { type: "string" },
        from: { type: "string" },
        to: { type: "string" },
        subject: { type: "string" },
        body: { type: "string" },
        htmlBody: { type: "string" },
        date: { type: "string" },
        snippet: { type: "string" },
        attachments: {
          type: "array",
          items: {
            type: "object",
            properties: {
              filename: { type: "string" },
              mimeType: { type: "string" },
              size: { type: "number" },
              attachmentId: { type: "string" },
            },
          },
        },
        userId: { type: "string" },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Webhook received and processed",
  })
  @ApiResponse({
    status: 400,
    description: "Invalid webhook payload",
  })
  async handleGmailWebhook(@Body() payload: GmailWebhookPayload) {
    if (!payload.messageId) {
      throw new HttpException("messageId is required", HttpStatus.BAD_REQUEST);
    }

    const triggerData = {
      messageId: payload.messageId,
      threadId: payload.threadId,
      from: payload.from,
      to: payload.to,
      subject: payload.subject,
      body: payload.body,
      htmlBody: payload.htmlBody,
      date: payload.date || new Date().toISOString(),
      snippet: payload.snippet,
      attachments: payload.attachments || [],
    };

    try {
      await this.triggerRegistry.fireTrigger(
        "gmail_receive_email",
        ServiceProvider.GMAIL,
        triggerData,
        payload.userId,
      );

      return {
        success: true,
        message: "Webhook processed successfully",
      };
    } catch (error) {
      console.error("Error processing Gmail webhook:", error);
      return {
        success: false,
        message: "Webhook received but processing failed",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  @Post("test/gmail")
  @Public()
  @ApiOperation({
    summary: "Test Gmail webhook endpoint",
    description:
      "Test endpoint for simulating Gmail webhook events. Useful for development and testing.",
  })
  @ApiQuery({
    name: "userId",
    required: false,
    description: "Optional user ID to filter workflows",
  })
  @ApiBody({
    description: "Test Gmail webhook payload",
  })
  @ApiResponse({
    status: 200,
    description: "Test webhook processed",
  })
  async testGmailWebhook(
    @Body() payload: Partial<GmailWebhookPayload>,
    @Query("userId") userId?: string,
  ) {
    const testPayload: GmailWebhookPayload = {
      messageId: payload.messageId || `test_${Date.now()}`,
      threadId: payload.threadId || `thread_${Date.now()}`,
      from: payload.from || "test@example.com",
      to: payload.to || "user@example.com",
      subject: payload.subject || "Test Email",
      body: payload.body || "This is a test email body",
      htmlBody: payload.htmlBody || "<p>This is a test email body</p>",
      date: payload.date || new Date().toISOString(),
      snippet: payload.snippet || "This is a test email snippet",
      attachments: payload.attachments || [],
      userId: userId || payload.userId,
    };

    return this.handleGmailWebhook(testPayload);
  }
}
