import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { Connection, Client, WorkflowHandle } from "@temporalio/client";
import {
  AutomationWorkflowInput,
  AutomationWorkflowOutput,
} from "../../temporal/workflows/automation.workflow";

@Injectable()
export class TemporalClientService implements OnModuleInit, OnModuleDestroy {
  private connection: Connection;
  private client: Client;
  private readonly taskQueue = "automation-workflows";

  async onModuleInit() {
    const temporalAddress = process.env.TEMPORAL_ADDRESS || "localhost:7233";

    console.log(
      `[TemporalClient] Connecting to Temporal server at ${temporalAddress}...`,
    );

    let retries = 10;
    let lastError: Error | null = null;

    while (retries > 0) {
      try {
        this.connection = await Connection.connect({
          address: temporalAddress,
        });

        this.client = new Client({
          connection: this.connection,
          namespace: "default",
        });

        console.log("[TemporalClient] Connected to Temporal server");
        return;
      } catch (error) {
        lastError = error as Error;
        retries--;

        if (retries > 0) {
          console.log(
            `[TemporalClient] Failed to connect, retrying... (${retries} attempts left)`,
          );
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      }
    }

    console.error(
      "[TemporalClient] Failed to connect to Temporal after all retries:",
      lastError,
    );
    throw new Error(
      `Could not connect to Temporal at ${temporalAddress}: ${lastError?.message}`,
    );
  }

  async onModuleDestroy() {
    if (this.connection) {
      await this.connection.close();
      console.log("[TemporalClient] Disconnected from Temporal server");
    }
  }

  async startAutomationWorkflow(
    workflowId: string,
    input: AutomationWorkflowInput,
  ): Promise<
    WorkflowHandle<
      typeof import("../../temporal/workflows/automation.workflow").automationWorkflow
    >
  > {
    const handle = await this.client.workflow.start("automationWorkflow", {
      taskQueue: this.taskQueue,
      workflowId: workflowId,
      args: [input],
      workflowExecutionTimeout: "10 minutes",
    });

    return handle;
  }

  getWorkflowHandle(workflowId: string): WorkflowHandle {
    return this.client.workflow.getHandle(workflowId);
  }

  async cancelWorkflow(workflowId: string): Promise<void> {
    const handle = this.getWorkflowHandle(workflowId);
    await handle.cancel();
  }

  async getWorkflowResult(
    workflowId: string,
  ): Promise<AutomationWorkflowOutput> {
    const handle = this.getWorkflowHandle(workflowId);
    return await handle.result();
  }

  async isWorkflowRunning(workflowId: string): Promise<boolean> {
    try {
      const handle = this.getWorkflowHandle(workflowId);
      const description = await handle.describe();
      return description.status.name === "RUNNING";
    } catch (error) {
      return false;
    }
  }
}
