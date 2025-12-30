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

export class ReadEmailAction implements IAction {
  public readonly id = "gmail_read_email";
  public readonly name = "Read Email";
  public readonly description = "Reads emails from Gmail inbox";
  public readonly type = ActionType.READ_EMAIL;
  public readonly serviceProvider = ServiceProvider.GMAIL;

  public readonly inputSchema = {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Gmail search query (e.g., 'from:example@gmail.com')",
      },
      maxResults: {
        type: "number",
        description: "Maximum number of emails to retrieve",
        default: 10,
      },
      labelIds: {
        type: "array",
        items: { type: "string" },
        description: "Label IDs to filter by",
      },
    },
  };

  public readonly outputSchema = {
    type: "object",
    properties: {
      messages: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            threadId: { type: "string" },
            snippet: { type: "string" },
            from: { type: "string" },
            subject: { type: "string" },
            date: { type: "string" },
          },
        },
      },
      totalCount: {
        type: "number",
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
      const client = new GmailClient(credentials);
      const { messages: messageList, totalCount } = await client.listMessages({
        query: params.query as string | undefined,
        maxResults: params.maxResults as number | undefined,
        labelIds: params.labelIds as string[] | undefined,
      });

      const messages = await Promise.all(
        messageList.map(async (msg: { id?: string }) => {
          if (!msg.id) {
            throw new Error("Message ID is missing");
          }
          const fullMessage = await client.getMessage(msg.id);
          const details = client.getMessageDetails(fullMessage);
          return {
            id: details.id,
            threadId: details.threadId,
            snippet: details.snippet,
            from: details.from,
            subject: details.subject,
            date: details.date,
          };
        }),
      );

      return {
        success: true,
        data: {
          messages,
          totalCount,
        },
        status: ExecutionStatus.SUCCESS,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to read emails",
        status: ExecutionStatus.FAILED,
      };
    }
  }
}
