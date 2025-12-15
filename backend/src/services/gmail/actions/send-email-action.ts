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
import { GmailClient } from "../gmail-client";

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

    try {
      const to = params.to as string;
      const subject = params.subject as string;
      const body = params.body as string;
      const cc = params.cc as string[] | undefined;
      const bcc = params.bcc as string[] | undefined;
      const isHtml = (params.isHtml as boolean) || false;

      if (!to || !subject || !body) {
        return {
          success: false,
          error: "Missing required fields: to, subject, body",
          status: ExecutionStatus.FAILED,
        };
      }

      const client = new GmailClient(credentials);
      const result = await client.sendEmail({
        to,
        cc,
        bcc,
        subject,
        body,
        isHtml,
      });

      return {
        success: true,
        data: {
          messageId: result.messageId,
          threadId: result.threadId,
        },
        status: ExecutionStatus.SUCCESS,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send email",
        status: ExecutionStatus.FAILED,
      };
    }
  }
}
