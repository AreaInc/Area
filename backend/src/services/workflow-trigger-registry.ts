import { Injectable, Inject, forwardRef } from "@nestjs/common";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { DRIZZLE } from "../db/drizzle.module";
import * as schema from "../db/schema";
import { WorkflowExecutionService } from "./workflow-execution-service";
import { WorkflowNode } from "./workflows-service";
import { ServiceProvider } from "../common/types/enums";
import { ITrigger } from "../common/types/interfaces";

interface RegisteredTrigger {
  workflowId: number;
  userId: string;
  triggerNode: WorkflowNode;
  trigger: ITrigger;
  credentialsId?: number;
}

@Injectable()
export class WorkflowTriggerRegistry {
  // Map: triggerId -> RegisteredTrigger[]
  private triggerMap: Map<string, RegisteredTrigger[]> = new Map();

  constructor(
    @Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>,
    @Inject(forwardRef(() => WorkflowExecutionService))
    private workflowExecutionService: WorkflowExecutionService,
  ) {}

  /**
   * Register a workflow's trigger node
   */
  registerTrigger(
    workflowId: number,
    userId: string,
    triggerNode: WorkflowNode,
    trigger: ITrigger,
    credentialsId?: number,
  ): void {
    const registration: RegisteredTrigger = {
      workflowId,
      userId,
      triggerNode,
      trigger,
      credentialsId,
    };

    const triggerId = this.getTriggerId(trigger);
    const existing = this.triggerMap.get(triggerId) || [];

    // Check if already registered
    const exists = existing.some(
      (r) => r.workflowId === workflowId && r.userId === userId,
    );

    if (!exists) {
      existing.push(registration);
      this.triggerMap.set(triggerId, existing);
    }
  }

  /**
   * Unregister a workflow's trigger
   */
  unregisterTrigger(workflowId: number, userId: string): void {
    for (const [triggerId, registrations] of this.triggerMap.entries()) {
      const filtered = registrations.filter(
        (r) => !(r.workflowId === workflowId && r.userId === userId),
      );

      if (filtered.length === 0) {
        this.triggerMap.delete(triggerId);
      } else {
        this.triggerMap.set(triggerId, filtered);
      }
    }
  }

  /**
   * Get all workflows registered for a specific trigger
   */
  getWorkflowsForTrigger(
    triggerId: string,
    serviceProvider: ServiceProvider,
  ): RegisteredTrigger[] {
    const fullTriggerId = `${serviceProvider}:${triggerId}`;
    return this.triggerMap.get(fullTriggerId) || [];
  }

  /**
   * Fire a trigger event - executes all workflows registered for this trigger
   */
  async fireTrigger(
    triggerId: string,
    serviceProvider: ServiceProvider,
    triggerData: Record<string, any>,
    userId?: string,
  ): Promise<void> {
    const workflows = this.getWorkflowsForTrigger(triggerId, serviceProvider);

    // Filter by userId if provided
    const targetWorkflows = userId
      ? workflows.filter((w) => w.userId === userId)
      : workflows;

    // Execute all matching workflows
    const executions = targetWorkflows.map((registration) =>
      this.workflowExecutionService.executeWorkflow(
        registration.workflowId,
        registration.userId,
        triggerData,
      ),
    );

    await Promise.allSettled(executions);
  }

  /**
   * Get all registered triggers for a user
   */
  getUserTriggers(userId: string): RegisteredTrigger[] {
    const all: RegisteredTrigger[] = [];
    for (const registrations of this.triggerMap.values()) {
      all.push(...registrations.filter((r) => r.userId === userId));
    }
    return all;
  }

  /**
   * Get all registered triggers for a workflow
   */
  getWorkflowTriggers(workflowId: number, userId: string): RegisteredTrigger[] {
    const all: RegisteredTrigger[] = [];
    for (const registrations of this.triggerMap.values()) {
      all.push(
        ...registrations.filter(
          (r) => r.workflowId === workflowId && r.userId === userId,
        ),
      );
    }
    return all;
  }

  /**
   * Generate a unique trigger ID
   */
  private getTriggerId(trigger: ITrigger): string {
    return `${trigger.serviceProvider}:${trigger.id}`;
  }

  /**
   * Clear all registrations (useful for testing)
   */
  clear(): void {
    this.triggerMap.clear();
  }
}
