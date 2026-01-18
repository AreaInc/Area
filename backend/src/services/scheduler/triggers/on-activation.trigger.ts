import { Inject, Injectable, Logger } from "@nestjs/common";
import { ITrigger, TriggerType } from "../../../common/types/trigger.interface";
import { WORKFLOWS_SERVICE } from "../../workflows/workflows.constants";

@Injectable()
export class OnActivationTrigger implements ITrigger {
  id = "on-activation";
  name = "On Activation";
  description = "Run once immediately when the automation is activated";
  serviceProvider = "scheduler"; // Using scheduler as generic provider
  triggerType = TriggerType.MANUAL;
  requiresCredentials = false;
  private readonly logger = new Logger(OnActivationTrigger.name);

  configSchema = {
    type: "object",
    properties: {},
  };

  outputSchema = { type: "object", properties: {} };

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
    this.logger.log(
      `[OnActivationTrigger] Activating workflow ${workflowId} immediately`,
    );

    // Execute immediately
    // We don't need to store registration because it's a one-shot fire upon activation
    await this.trigger(workflowId);
  }

  async unregister(workflowId: number) {
    // Nothing to clean up
  }

  async validateConfig(config: Record<string, any>) {
    return true;
  }

  private async trigger(workflowId: number) {
    try {
      await this.workflowsService.triggerWorkflowExecution(workflowId, {
        triggeredAt: new Date().toISOString(),
        source: "on-activation",
      });
      this.logger.debug(
        `[OnActivationTrigger] Triggered workflow ${workflowId}`,
      );
    } catch (error) {
      this.logger.error(
        `[OnActivationTrigger] Failed to trigger workflow ${workflowId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
