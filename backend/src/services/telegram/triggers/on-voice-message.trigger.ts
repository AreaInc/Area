import { Injectable } from "@nestjs/common";
import {
  ITrigger,
  TriggerMetadata,
  TriggerType,
} from "../../../common/types/trigger.interface";

@Injectable()
export class OnVoiceMessageTrigger implements ITrigger {
  id = "on-voice-message";
  name = "On Voice Message (Telegram)";
  description = "Triggers when a voice message is sent";
  serviceProvider = "telegram";
  triggerType = TriggerType.POLLING;
  requiresCredentials = false;

  configSchema = {
    type: "object",
    required: ["botToken"],
    properties: {
      botToken: { type: "string", description: "Telegram Bot Token" },
    },
  };

  async validateConfig(config: Record<string, any>): Promise<boolean> {
    if (!config.botToken) throw new Error("Bot Token is required");
    return true;
  }

  async register(
    workflowId: number,
    config: Record<string, any>,
  ): Promise<void> {}

  async unregister(workflowId: number): Promise<void> {}

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
