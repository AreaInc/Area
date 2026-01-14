import { Injectable } from "@nestjs/common";
import {
  IAction,
  ActionMetadata,
} from "../../../common/types/action.interface";

@Injectable()
export class ReadEmailAction implements IAction {
  id = "read-email";
  name = "Read Email";
  description = "Read recent emails via Gmail with optional filters";
  serviceProvider = "gmail";
  requiresCredentials = true;

  inputSchema = {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Gmail search query (e.g., 'from:boss@example.com')",
        example: "subject:invoice has:attachment",
      },
      maxResults: {
        type: "number",
        description: "Maximum number of messages to fetch (1-100)",
        minimum: 1,
        maximum: 100,
        default: 10,
      },
      labelIds: {
        type: "array",
        items: { type: "string" },
        description: "Filter by Gmail label IDs",
        example: ["INBOX", "IMPORTANT"],
      },
    },
  };

  outputSchema = {
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
            to: { type: "string" },
            subject: { type: "string" },
            date: { type: "string" },
          },
        },
      },
      totalCount: {
        type: "number",
        description: "Number of messages returned",
      },
      success: {
        type: "boolean",
        description: "Whether the read operation succeeded",
      },
      error: {
        type: "string",
        description: "Error message if the action failed",
      },
    },
  };

  async validateInput(config: Record<string, any>): Promise<boolean> {
    if (config.query !== undefined && typeof config.query !== "string") {
      throw new Error('Invalid "query" field: must be a string');
    }

    if (config.maxResults !== undefined) {
      const isValidNumber =
        typeof config.maxResults === "number" &&
        Number.isInteger(config.maxResults) &&
        config.maxResults >= 1 &&
        config.maxResults <= 100;

      if (!isValidNumber) {
        throw new Error('Invalid "maxResults" field: must be an integer 1-100');
      }
    }

    if (config.labelIds !== undefined) {
      if (
        !Array.isArray(config.labelIds) ||
        !config.labelIds.every((label: any) => typeof label === "string")
      ) {
        throw new Error(
          'Invalid "labelIds" field: must be an array of strings',
        );
      }
    }

    return true;
  }

  getMetadata(): ActionMetadata {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      serviceProvider: this.serviceProvider,
      inputSchema: this.inputSchema,
      outputSchema: this.outputSchema,
      requiresCredentials: this.requiresCredentials,
    };
  }
}
