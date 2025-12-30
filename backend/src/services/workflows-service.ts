import { Injectable, Inject, forwardRef } from "@nestjs/common";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { eq, and, desc } from "drizzle-orm";
import { DRIZZLE } from "../db/drizzle.module";
import * as schema from "../db/schema";
import { WorkflowTriggerRegistry } from "./workflow-trigger-registry";
import { ServiceRegistry } from "./service-registry";
import { ITrigger } from "../common/types/interfaces";

export interface WorkflowNode {
  id: string;
  type: string;
  config: Record<string, any>;
  credentialsId?: number;
}

export interface WorkflowConnection {
  node: string;
  input: number;
  output: number;
}

export interface WorkflowData {
  name: string;
  description?: string;
  version?: number;
  nodes: WorkflowNode[];
  connections: Record<string, WorkflowConnection[]>;
}

@Injectable()
export class WorkflowsService {
  constructor(
    @Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>,
    @Inject(forwardRef(() => WorkflowTriggerRegistry))
    private triggerRegistry: WorkflowTriggerRegistry,
    private serviceRegistry: ServiceRegistry,
  ) {}

  async createWorkflow(
    userId: string,
    workflowData: WorkflowData,
  ): Promise<typeof schema.workflows.$inferSelect> {
    const [workflow] = await this.db
      .insert(schema.workflows)
      .values({
        userId,
        name: workflowData.name,
        description: workflowData.description || null,
        version: workflowData.version || 1,
        nodes: workflowData.nodes as any,
        connections: workflowData.connections as any,
        isActive: false,
      })
      .returning();

    return workflow;
  }

  async getWorkflowById(
    workflowId: number,
    userId: string,
  ): Promise<typeof schema.workflows.$inferSelect | null> {
    const [workflow] = await this.db
      .select()
      .from(schema.workflows)
      .where(
        and(
          eq(schema.workflows.id, workflowId),
          eq(schema.workflows.userId, userId),
        ),
      )
      .limit(1);

    return workflow || null;
  }

  async getUserWorkflows(userId: string) {
    return this.db
      .select()
      .from(schema.workflows)
      .where(eq(schema.workflows.userId, userId))
      .orderBy(desc(schema.workflows.updatedAt));
  }

  async updateWorkflow(
    workflowId: number,
    userId: string,
    updates: Partial<WorkflowData>,
  ): Promise<typeof schema.workflows.$inferSelect | null> {
    const updateData: {
      updatedAt: Date;
      name?: string;
      description?: string | null;
      version?: number;
      nodes?: WorkflowNode[];
      connections?: Record<string, WorkflowConnection[]>;
    } = {
      updatedAt: new Date(),
    };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined)
      updateData.description = updates.description;
    if (updates.version !== undefined) updateData.version = updates.version;
    if (updates.nodes !== undefined) updateData.nodes = updates.nodes;
    if (updates.connections !== undefined)
      updateData.connections = updates.connections;

    const [workflow] = await this.db
      .update(schema.workflows)
      .set(updateData)
      .where(
        and(
          eq(schema.workflows.id, workflowId),
          eq(schema.workflows.userId, userId),
        ),
      )
      .returning();

    return workflow || null;
  }

  async deleteWorkflow(workflowId: number, userId: string): Promise<boolean> {
    // Unregister triggers before deleting
    this.triggerRegistry.unregisterTrigger(workflowId, userId);

    const result = await this.db
      .delete(schema.workflows)
      .where(
        and(
          eq(schema.workflows.id, workflowId),
          eq(schema.workflows.userId, userId),
        ),
      );

    return Array.isArray(result) ? result.length > 0 : false;
  }

  async setWorkflowActive(
    workflowId: number,
    userId: string,
    isActive: boolean,
  ): Promise<typeof schema.workflows.$inferSelect | null> {
    const [workflow] = await this.db
      .update(schema.workflows)
      .set({
        isActive,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schema.workflows.id, workflowId),
          eq(schema.workflows.userId, userId),
        ),
      )
      .returning();

    if (workflow) {
      // Register or unregister triggers based on activation status
      if (isActive) {
        this.registerWorkflowTriggers(workflowId, userId, workflow);
      } else {
        this.triggerRegistry.unregisterTrigger(workflowId, userId);
      }
    }

    return workflow || null;
  }

  /**
   * Register all trigger nodes in a workflow
   */
  private registerWorkflowTriggers(
    workflowId: number,
    userId: string,
    workflow: typeof schema.workflows.$inferSelect,
  ): void {
    const nodes = workflow.nodes as WorkflowNode[];
    const connections = workflow.connections as Record<
      string,
      WorkflowConnection[]
    >;

    // Find trigger nodes (nodes with no incoming connections)
    const incomingCount = new Map<string, number>();
    nodes.forEach((node) => {
      incomingCount.set(node.id, 0);
    });

    Object.entries(connections).forEach(([, conns]) => {
      conns.forEach((conn) => {
        const current = incomingCount.get(conn.node) || 0;
        incomingCount.set(conn.node, current + 1);
      });
    });

    // Nodes with no incoming connections are potential triggers
    const triggerNodes = nodes.filter(
      (node) => incomingCount.get(node.id) === 0,
    );

    // Register each trigger node
    for (const triggerNode of triggerNodes) {
      const trigger = this.findTriggerForNode(triggerNode);
      if (trigger) {
        this.triggerRegistry.registerTrigger(
          workflowId,
          userId,
          triggerNode,
          trigger,
          triggerNode.credentialsId,
        );
      }
    }
  }

  /**
   * Find the trigger action for a workflow node
   */
  private findTriggerForNode(node: WorkflowNode): ITrigger | null {
    // Parse node type (format: "service:action" or just "action")
    const [serviceProvider, actionId] = node.type.includes(":")
      ? node.type.split(":", 2)
      : [null, node.type];

    // Try to find the trigger in services
    if (serviceProvider) {
      const service = this.serviceRegistry.get(
        serviceProvider as unknown as import("../common/types/enums").ServiceProvider,
      );
      if (service) {
        const action = service.getAction(actionId);
        if (action && "isTrigger" in action && action.isTrigger) {
          return action as ITrigger;
        }
      }
    } else {
      // Search all services
      const allServices = this.serviceRegistry.getAll();
      for (const service of allServices) {
        const action = service.getAction(actionId);
        if (action && "isTrigger" in action && action.isTrigger) {
          return action as ITrigger;
        }
      }
    }

    return null;
  }

  async updateLastRun(workflowId: number): Promise<void> {
    await this.db
      .update(schema.workflows)
      .set({
        lastRun: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.workflows.id, workflowId));
  }
}
