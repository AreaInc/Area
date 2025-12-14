import {
  IAction,
  ActionParams,
  ActionResult,
  ICredentials,
} from "../../../common/types/interfaces";
import {
  ActionType,
  ServiceProvider,
  ExecutionStatus,
} from "../../../common/types/enums";
import { GmailCredentials } from "../gmail-credentials";

export class SendEmailAction implements IAction {
  public readonly id = "gmail_send_email";
  public readonly name = "Send Email";
  public readonly description = "Sends an email using Gmail";
  public readonly type = ActionType.SEND_EMAIL;
  public readonly serviceProvider = ServiceProvider.GMAIL;

  public readonly inputSchema = {
    type: "object",
    required: ["to", "subject", "body"],
    properties: {
      to: {
        type: "string",
        description: "Recipient email address",
      },
      cc: {
        type: "array",
        items: { type: "string" },
        description: "CC recipients",
      },
      bcc: {
        type: "array",
        items: { type: "string" },
        description: "BCC recipients",
      },
      subject: {
        type: "string",
        description: "Email subject",
      },
      body: {
        type: "string",
        description: "Email body (HTML or plain text)",
      },
      isHtml: {
        type: "boolean",
        description: "Whether the body is HTML",
        default: false,
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
    },
  };

  execute(
    params: ActionParams,
    credentials: ICredentials,
  ): Promise<ActionResult> {
    if (!(credentials instanceof GmailCredentials)) {
      return Promise.resolve({
        success: false,
        error: "Invalid credentials type for Gmail service",
        status: ExecutionStatus.FAILED,
      });
    }

    try {
      void params;
      credentials.getAccessToken();

      const messageId = `mock_message_${Date.now()}`;
      const threadId = `mock_thread_${Date.now()}`;

      return Promise.resolve({
        success: true,
        data: {
          messageId,
          threadId,
        },
        status: ExecutionStatus.SUCCESS,
      });
    } catch (error) {
      return Promise.resolve({
        success: false,
        error: error instanceof Error ? error.message : "Failed to send email",
        status: ExecutionStatus.FAILED,
      });
    }
  }
}
