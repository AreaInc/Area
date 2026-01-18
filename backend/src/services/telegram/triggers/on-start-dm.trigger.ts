import { Injectable } from "@nestjs/common";
import {
  ITrigger,
  TriggerMetadata,
  TriggerType,
} from "../../../common/types/trigger.interface";

@Injectable()
export class OnStartDmTrigger implements ITrigger {
  id = "on-start-dm";
  name = "On Start DM (First Interaction)";
  description = "Triggers when a user sends /start in a private DM";
  serviceProvider = "telegram";
  triggerType = TriggerType.POLLING;
  requiresCredentials = true;

  configSchema = {
    type: "object",
    required: ["botToken"],
    properties: {
      botToken: { type: "string", description: "Telegram Bot Token" },
    },
  };

  async register(
    workflowId: number,
    config: Record<string, any>,
  ): Promise<void> {
    return;
  }

  async unregister(workflowId: number): Promise<void> {
    return;
  }

  async validateConfig(config: Record<string, any>): Promise<boolean> {
    return !!config.botToken;
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
