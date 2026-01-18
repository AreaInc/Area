import { Injectable } from "@nestjs/common";
import {
  ITrigger,
  TriggerMetadata,
  TriggerType,
} from "../../../common/types/trigger.interface";

@Injectable()
export class OnMessageTrigger implements ITrigger {
  id = "on-message";
  name = "On Message (Telegram)";
  description = "Triggers when a Telegram bot receives a message";
  serviceProvider = "telegram";
  triggerType = TriggerType.POLLING;
  requiresCredentials = false; // user provides bot token in config

  configSchema = {
    type: "object",
    required: ["botToken"],
    properties: {
      botToken: { type: "string", description: "Telegram Bot Token" },
      matchText: {
        type: "string",
        description: "Optional regex or text to match",
      },
    },
  };

  async validateConfig(config: Record<string, any>): Promise<boolean> {
    if (!config.botToken) throw new Error("Bot Token is required");
    return true;
  }

  async register(
    _workflowId: number,
    _config: Record<string, any>,
  ): Promise<void> {
    // Polling service handles this
  }

  async unregister(_workflowId: number): Promise<void> {
    // Polling service handles this
  }

  getMetadata(): TriggerMetadata {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      serviceProvider: this.serviceProvider,
      triggerType: this.triggerType,
      configSchema: this.configSchema,
      requiresCredentials: this.requiresCredentials,
    };
  }
}
