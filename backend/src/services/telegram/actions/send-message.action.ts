import { Injectable } from "@nestjs/common";
import { IAction, ActionMetadata } from "../../../common/types/action.interface";

@Injectable()
export class SendTelegramMessageAction implements IAction {
  id = "send-message";
  name = "Send Telegram Message";
  description = "Send a message to a Telegram chat via bot token";
  serviceProvider = "telegram";
  requiresCredentials = false;

  inputSchema = {
    type: "object",
    required: ["botToken", "chatId", "text"],
    properties: {
      botToken: { type: "string", description: "Telegram bot token" },
      chatId: {
        type: "string",
        description: "Target chat ID (user, group, or channel)",
      },
      text: { type: "string", description: "Message text" },
      parseMode: {
        type: "string",
        description: "Formatting: Markdown, MarkdownV2, or HTML",
      },
      disableWebPagePreview: {
        type: "boolean",
        description: "Disable link previews in the message",
      },
      disableNotification: {
        type: "boolean",
        description: "Send message silently",
      },
    },
  };

  outputSchema = {
    type: "object",
    properties: {
      delivered: { type: "boolean" },
      status: { type: "number" },
      messageId: { type: "number" },
    },
  };

  async validateInput(config: Record<string, any>): Promise<boolean> {
    if (!config.botToken || typeof config.botToken !== "string") {
      throw new Error("botToken is required");
    }
    if (!config.chatId || typeof config.chatId !== "string") {
      throw new Error("chatId is required");
    }
    if (!config.text || typeof config.text !== "string") {
      throw new Error("text is required");
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
