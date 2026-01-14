import { Injectable } from "@nestjs/common";
import { ITrigger, TriggerType } from "../../../common/types/trigger.interface";

@Injectable()
export class PublicWebhookTrigger implements ITrigger {
  id = "incoming-webhook";
  name = "Public Webhook";
  description = "Fire workflows from any HTTP POST";
  serviceProvider = "webhook";
  triggerType = TriggerType.WEBHOOK;
  requiresCredentials = false;

  configSchema = {
    type: "object",
    required: ["path"],
    properties: {
      path: { type: "string", description: "Webhook endpoint path" },
      secret: {
        type: "string",
        description: "Optional shared secret to validate payloads",
      },
    },
  };

  outputSchema = {
    type: "object",
    properties: {
      payload: { type: "object" },
      headers: { type: "object" },
    },
  };

  private registrations = new Map<number, Record<string, any>>();

  async register(workflowId: number, config: Record<string, any>) {
    this.registrations.set(workflowId, config);
  }

  async unregister(workflowId: number) {
    this.registrations.delete(workflowId);
  }

  async validateConfig(config: Record<string, any>) {
    if (!config.path || typeof config.path !== "string") {
      throw new Error("path is required");
    }
    return true;
  }

  isRegistered(workflowId: number) {
    return this.registrations.has(workflowId);
  }
}
