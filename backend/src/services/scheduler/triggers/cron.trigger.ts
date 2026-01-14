import { Injectable } from "@nestjs/common";
import { ITrigger, TriggerType } from "../../../common/types/trigger.interface";

@Injectable()
export class CronTrigger implements ITrigger {
  id = "cron";
  name = "Cron Schedule";
  description = "Run on a provided cron expression";
  serviceProvider = "scheduler";
  triggerType = TriggerType.SCHEDULED;
  requiresCredentials = false;

  configSchema = {
    type: "object",
    required: ["cron"],
    properties: {
      cron: { type: "string", description: "Cron expression" },
    },
  };

  outputSchema = { type: "object", properties: {} };

  private registrations = new Map<number, Record<string, any>>();

  async register(workflowId: number, config: Record<string, any>) {
    await this.validateConfig(config);
    this.registrations.set(workflowId, config);
  }

  async unregister(workflowId: number) {
    this.registrations.delete(workflowId);
  }

  async validateConfig(config: Record<string, any>) {
    if (!config.cron || typeof config.cron !== "string") {
      throw new Error("cron expression required");
    }
    return true;
  }

  isRegistered(workflowId: number) {
    return this.registrations.has(workflowId);
  }
}
