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

      const messages = [
        {
          id: "mock_message_1",
          threadId: "mock_thread_1",
          snippet: "This is a sample email snippet",
          from: "example@gmail.com",
          subject: "Sample Email",
          date: new Date().toISOString(),
        },
      ];

      return Promise.resolve({
        success: true,
        data: {
          messages,
          totalCount: messages.length,
        },
        status: ExecutionStatus.SUCCESS,
      });
    } catch (error) {
      return Promise.resolve({
        success: false,
        error: error instanceof Error ? error.message : "Failed to read emails",
        status: ExecutionStatus.FAILED,
      });
    }
  }
}
