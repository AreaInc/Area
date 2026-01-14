import { Injectable } from "@nestjs/common";
import { IAction, ActionMetadata } from "../../../common/types/action.interface";

@Injectable()
export class SendDiscordWebhookAction implements IAction {
  id = "send-webhook";
  name = "Send Discord Webhook";
  description = "Post a message to a Discord webhook URL";
  serviceProvider = "discord";
  requiresCredentials = false;

  inputSchema = {
    type: "object",
    required: ["webhookUrl", "content"],
    properties: {
      webhookUrl: { type: "string", description: "Discord webhook URL" },
      content: { type: "string", description: "Message content" },
    },
  };

  outputSchema = {
    type: "object",
    properties: {
      delivered: { type: "boolean" },
      status: { type: "number" },
    },
  };

  async validateInput(config: Record<string, any>): Promise<boolean> {
    if (!config.webhookUrl || typeof config.webhookUrl !== "string") {
      throw new Error("webhookUrl is required");
    }
    if (!config.content || typeof config.content !== "string") {
      throw new Error("content is required");
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
