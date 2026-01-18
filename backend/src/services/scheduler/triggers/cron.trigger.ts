import { Inject, Injectable, Logger } from "@nestjs/common";
import { ITrigger, TriggerType } from "../../../common/types/trigger.interface";
import { WORKFLOWS_SERVICE } from "../../workflows/workflows.constants";

@Injectable()
export class CronTrigger implements ITrigger {
  id = "cron";
  name = "Cron Schedule";
  description = "Run on a provided cron expression";
  serviceProvider = "scheduler";
  triggerType = TriggerType.SCHEDULED;
  requiresCredentials = false;
  private readonly logger = new Logger(CronTrigger.name);

  configSchema = {
    type: "object",
    required: ["cron"],
    properties: {
      cron: { type: "string", description: "Cron expression" },
    },
  };

  outputSchema = { type: "object", properties: {} };

  private registrations = new Map<
    number,
    {
      config: Record<string, any>;
      timeout?: NodeJS.Timeout;
      interval?: NodeJS.Timeout;
    }
  >();

  constructor(
    @Inject(WORKFLOWS_SERVICE)
    private readonly workflowsService: {
      triggerWorkflowExecution: (
        workflowId: number,
        triggerData: Record<string, any>,
      ) => Promise<any>;
    },
  ) {}

  async register(workflowId: number, config: Record<string, any>) {
    await this.validateConfig(config);

    // Clear any existing timers before re-registering
    await this.unregister(workflowId);

    const { intervalMs, firstDelayMs } = this.getSchedule(config.cron);

    const timeout = setTimeout(async () => {
      await this.trigger(workflowId, config);
      const intervalHandle = setInterval(
        () => this.trigger(workflowId, config),
        intervalMs,
      );
      const existing = this.registrations.get(workflowId);
      if (existing) existing.interval = intervalHandle;
    }, firstDelayMs);

    this.registrations.set(workflowId, { config, timeout });
    this.logger.log(
      `[CronTrigger] Registered workflow ${workflowId} with cron "${config.cron}" (first run in ${Math.round(firstDelayMs / 1000)}s)`,
    );
  }

  async unregister(workflowId: number) {
    const existing = this.registrations.get(workflowId);
    if (existing?.timeout) clearTimeout(existing.timeout);
    if (existing?.interval) clearInterval(existing.interval);
    this.registrations.delete(workflowId);
    this.logger.log(`[CronTrigger] Unregistered workflow ${workflowId}`);
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

  private getSchedule(cron: string): {
    intervalMs: number;
    firstDelayMs: number;
  } {
    const parts = cron.trim().split(/\s+/);
    if (parts.length < 5) {
      throw new Error("cron expression must have 5 fields (m h dom mon dow)");
    }

    const [minuteField, hourField] = parts;

    // Support */N minutes (e.g., */5 * * * *)
    if (minuteField.startsWith("*/")) {
      const everyMinutes = parseInt(minuteField.slice(2), 10);
      if (!everyMinutes || everyMinutes <= 0) {
        throw new Error("invalid minute step in cron expression");
      }
      const intervalMs = everyMinutes * 60 * 1000;
      const firstDelayMs = this.calcNextMinuteDelay(everyMinutes);
      return { intervalMs, firstDelayMs };
    }

    // Support top-of-hour patterns (0 * * * *) or 0 */N * * *
    if (minuteField === "0") {
      if (hourField === "*") {
        const intervalMs = 60 * 60 * 1000;
        const firstDelayMs = this.calcNextHourDelay(1);
        return { intervalMs, firstDelayMs };
      }

      if (hourField.startsWith("*/")) {
        const everyHours = parseInt(hourField.slice(2), 10);
        if (!everyHours || everyHours <= 0) {
          throw new Error("invalid hour step in cron expression");
        }
        const intervalMs = everyHours * 60 * 60 * 1000;
        const firstDelayMs = this.calcNextHourDelay(everyHours);
        return { intervalMs, firstDelayMs };
      }
    }

    throw new Error(
      "Unsupported cron expression. Supported patterns: */N * * * *, 0 * * * *, 0 */N * * *",
    );
  }

  private calcNextMinuteDelay(everyMinutes: number): number {
    const now = new Date();
    const next = new Date(now.getTime());
    const remainder = now.getMinutes() % everyMinutes;
    const minutesToAdd =
      remainder === 0 ? everyMinutes : everyMinutes - remainder;
    next.setMinutes(now.getMinutes() + minutesToAdd, 0, 0);
    return next.getTime() - now.getTime();
  }

  private calcNextHourDelay(everyHours: number): number {
    const now = new Date();
    const next = new Date(now.getTime());
    const remainder = now.getHours() % everyHours;
    const hoursToAdd = remainder === 0 ? everyHours : everyHours - remainder;
    next.setHours(now.getHours() + hoursToAdd, 0, 0, 0);
    return next.getTime() - now.getTime();
  }

  private async trigger(workflowId: number, config: Record<string, any>) {
    try {
      await this.workflowsService.triggerWorkflowExecution(workflowId, {
        scheduledAt: new Date().toISOString(),
        schedule: config.cron,
      });
      this.logger.debug(
        `[CronTrigger] Triggered workflow ${workflowId} for cron "${config.cron}"`,
      );
    } catch (error) {
      this.logger.error(
        `[CronTrigger] Failed to trigger workflow ${workflowId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
