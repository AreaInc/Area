import { Injectable, Inject } from "@nestjs/common";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { eq, and, desc } from "drizzle-orm";
import { DRIZZLE } from "../db/drizzle.module";
import * as schema from "../db/schema";
import {
  ServiceProvider,
  ActionType,
  ExecutionStatus,
} from "../common/types/enums";

@Injectable()
export class ActionsService {
  constructor(@Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>) {}

  async saveActionMetadata(
    serviceProvider: ServiceProvider,
    actionId: string,
    name: string,
    description: string,
    type: ActionType,
    inputSchema: Record<string, any>,
    outputSchema?: Record<string, any>,
  ): Promise<typeof schema.serviceActions.$inferSelect> {
    const [action] = await this.db
      .insert(schema.serviceActions)
      .values({
        serviceProvider:
          serviceProvider as unknown as (typeof schema.serviceProviderEnum.enumValues)[number],
        actionId,
        name,
        description,
        type: type as unknown as (typeof schema.actionTypeEnum.enumValues)[number],
        inputSchema,
        outputSchema: outputSchema || null,
      })
      .onConflictDoUpdate({
        target: [
          schema.serviceActions.serviceProvider,
          schema.serviceActions.actionId,
        ],
        set: {
          name,
          description,
          type: type as unknown as (typeof schema.actionTypeEnum.enumValues)[number],
          inputSchema,
          outputSchema: outputSchema || null,
          updatedAt: new Date(),
        },
      })
      .returning();

    return action;
  }

  async getServiceActions(serviceProvider: ServiceProvider) {
    return this.db
      .select()
      .from(schema.serviceActions)
      .where(
        eq(
          schema.serviceActions.serviceProvider,
          serviceProvider as unknown as (typeof schema.serviceProviderEnum.enumValues)[number],
        ),
      );
  }

  async getAction(serviceProvider: ServiceProvider, actionId: string) {
    const [action] = await this.db
      .select()
      .from(schema.serviceActions)
      .where(
        and(
          eq(
            schema.serviceActions.serviceProvider,
            serviceProvider as unknown as (typeof schema.serviceProviderEnum.enumValues)[number],
          ),
          eq(schema.serviceActions.actionId, actionId),
        ),
      )
      .limit(1);

    return action;
  }

  async logExecution(
    userId: string,
    serviceProvider: ServiceProvider,
    actionId: string,
    credentialsId: number | null,
    status: ExecutionStatus,
    inputParams?: Record<string, any>,
    outputData?: Record<string, any>,
    errorMessage?: string,
  ): Promise<typeof schema.actionExecutions.$inferSelect> {
    const [execution] = await this.db
      .insert(schema.actionExecutions)
      .values({
        userId,
        serviceProvider:
          serviceProvider as unknown as (typeof schema.serviceProviderEnum.enumValues)[number],
        actionId,
        credentialsId,
        status: status as string,
        inputParams: inputParams || null,
        outputData: outputData || null,
        errorMessage: errorMessage || null,
        completedAt:
          status !== ExecutionStatus.RUNNING &&
          status !== ExecutionStatus.PENDING
            ? new Date()
            : null,
      })
      .returning();

    return execution;
  }

  async updateExecutionStatus(
    executionId: number,
    status: ExecutionStatus,
    outputData?: Record<string, any>,
    errorMessage?: string,
  ): Promise<void> {
    await this.db
      .update(schema.actionExecutions)
      .set({
        status: status as string,
        outputData: outputData || null,
        errorMessage: errorMessage || null,
        completedAt:
          status !== ExecutionStatus.RUNNING &&
          status !== ExecutionStatus.PENDING
            ? new Date()
            : null,
      })
      .where(eq(schema.actionExecutions.id, executionId));
  }

  async getUserExecutions(userId: string, limit = 50) {
    return this.db
      .select()
      .from(schema.actionExecutions)
      .where(eq(schema.actionExecutions.userId, userId))
      .orderBy(desc(schema.actionExecutions.createdAt))
      .limit(limit);
  }
}
