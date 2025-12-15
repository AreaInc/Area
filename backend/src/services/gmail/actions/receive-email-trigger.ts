import {
  ITrigger,
  ActionParams,
  ActionResult,
  ICredentials,
} from "../../../common/types/interfaces";
import {
  ActionType,
  ServiceProvider,
  ExecutionStatus,
  TriggerType,
} from "../../../common/types/enums";
import { GmailCredentials } from "../gmail-credentials";
import { GmailClient } from "../gmail-client";

export class ReceiveEmailTrigger implements ITrigger {
  public readonly id = "gmail_receive_email";
  public readonly name = "Receive Email";
  public readonly description =
    "Triggers when a new email is received in Gmail";
  public readonly type = ActionType.RECEIVE_EMAIL;
  public readonly serviceProvider = ServiceProvider.GMAIL;
  public readonly isTrigger = true as const;
  public readonly triggerType = TriggerType.EVENT;

  public readonly inputSchema = {
    type: "object",
    properties: {
      from: {
        type: "string",
        description: "Filter emails from specific sender (optional)",
      },
      subject: {
        type: "string",
        description: "Filter emails with specific subject (optional)",
      },
      labelIds: {
        type: "array",
        items: { type: "string" },
        description: "Filter emails by label IDs (optional)",
      },
    },
  };

  public readonly outputSchema = {
    type: "object",
    properties: {
      messageId: {
        type: "string",
        description: "Gmail message ID",
      },
      threadId: {
        type: "string",
        description: "Gmail thread ID",
      },
      from: {
        type: "string",
        description: "Email sender",
      },
      to: {
        type: "string",
        description: "Email recipient",
      },
      subject: {
        type: "string",
        description: "Email subject",
      },
      body: {
        type: "string",
        description: "Email body (plain text)",
      },
      htmlBody: {
        type: "string",
        description: "Email body (HTML)",
      },
      date: {
        type: "string",
        description: "Email date (ISO 8601)",
      },
      snippet: {
        type: "string",
        description: "Email snippet",
      },
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
        description: "Email attachments",
      },
    },
  };

  async execute(
    params: ActionParams,
    credentials: ICredentials,
  ): Promise<ActionResult> {
    if (!(credentials instanceof GmailCredentials)) {
      return {
        success: false,
        error: "Invalid credentials type for Gmail service",
        status: ExecutionStatus.FAILED,
      };
    }

    const messageId = params.messageId as string | undefined;
    if (!messageId) {
      return {
        success: false,
        error: "messageId is required for receive_email trigger",
        status: ExecutionStatus.FAILED,
      };
    }

    try {
      const client = new GmailClient(credentials);
      const message = await client.getMessage(messageId);
      const details = client.getMessageDetails(message);

      if (params.from && !details.from.includes(params.from as string)) {
        return {
          success: false,
          error: "Email does not match filter criteria",
          status: ExecutionStatus.FAILED,
        };
      }

      if (
        params.subject &&
        !details.subject.includes(params.subject as string)
      ) {
        return {
          success: false,
          error: "Email does not match filter criteria",
          status: ExecutionStatus.FAILED,
        };
      }

      return {
        success: true,
        data: {
          messageId: details.id,
          threadId: details.threadId,
          from: details.from,
          to: details.to,
          subject: details.subject,
          body: details.body,
          htmlBody: details.htmlBody,
          date: details.date,
          snippet: details.snippet,
          attachments: details.attachments,
        },
        status: ExecutionStatus.SUCCESS,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to process email trigger",
        status: ExecutionStatus.FAILED,
      };
    }
  }
}
