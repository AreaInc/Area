import { Injectable, Inject } from "@nestjs/common";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { eq, and, desc } from "drizzle-orm";
import { DRIZZLE } from "../db/drizzle.module";
import * as schema from "../db/schema";

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
  constructor(@Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>) {}

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

    return workflow || null;
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
