import { Injectable } from "@nestjs/common";
import {
  IAction,
  ActionMetadata,
} from "../../../common/types/action.interface";

@Injectable()
export class PinMessageAction implements IAction {
  id = "pin-message";
  name = "Pin Telegram Message";
  description = "Pin a message in a Telegram chat";
  serviceProvider = "telegram";
  requiresCredentials = false;

  inputSchema = {
    type: "object",
    required: ["botToken", "chatId", "messageId"],
    properties: {
      botToken: { type: "string", description: "Telegram Bot Token" },
      chatId: { type: "string", description: "Target Chat ID" },
      messageId: { type: "string", description: "ID of message to pin" },
      disableNotification: { type: "boolean", description: "Pin silently" },
    },
  };

  outputSchema = {
    type: "object",
    properties: {
      success: { type: "boolean" },
      error: { type: "string" },
    },
  };

  async validateInput(config: Record<string, any>): Promise<boolean> {
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
