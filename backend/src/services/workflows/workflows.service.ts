import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
} from "@nestjs/common";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { DRIZZLE } from "../../db/drizzle.module";
import * as schema from "../../db/schema";
import { workflows, workflowExecutions } from "../../db/schema";
import { eq, and, desc } from "drizzle-orm";
import { TemporalClientService } from "../temporal/temporal-client.service";
import { TriggerRegistryService } from "../registries/trigger-registry.service";
import { ActionRegistryService } from "../registries/action-registry.service";
import { AutomationWorkflowInput } from "../../temporal/workflows/automation.workflow";

export interface CreateWorkflowDto {
  name: string;
  description?: string;
  trigger: {
    provider: string;
    triggerId: string;
    config: Record<string, any>;
  };
  action: {
    provider: string;
    actionId: string;
    config: Record<string, any>;
    credentialsId?: number;
  };
}

export interface UpdateWorkflowDto {
  name?: string;
  description?: string;
  trigger?: {
    provider: string;
    triggerId: string;
    config: Record<string, any>;
  };
  action?: {
    provider: string;
    actionId: string;
    config: Record<string, any>;
    credentialsId?: number;
  };
}

@Injectable()
export class WorkflowsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly temporalClient: TemporalClientService,
    private readonly triggerRegistry: TriggerRegistryService,
    private readonly actionRegistry: ActionRegistryService,
  ) { }

  async createWorkflow(userId: string, dto: CreateWorkflowDto) {
    const trigger = this.triggerRegistry.get(
      dto.trigger.provider,
      dto.trigger.triggerId,
    );
    if (!trigger) {
      throw new BadRequestException(
        `Trigger not found: ${dto.trigger.provider}:${dto.trigger.triggerId}`,
      );
    }

    const action = this.actionRegistry.get(
      dto.action.provider,
      dto.action.actionId,
    );
    if (!action) {
      throw new BadRequestException(
        `Action not found: ${dto.action.provider}:${dto.action.actionId}`,
      );
    }

    // Validation is optional during creation - workflows can be created with empty configs
    // and configured later. Validation will be enforced during activation.
    // Only validate if config is not empty to allow creating workflow skeletons
    if (Object.keys(dto.trigger.config).length > 0) {
      try {
        await trigger.validateConfig(dto.trigger.config);
      } catch (error) {
        throw new BadRequestException(
          `Invalid trigger configuration: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    if (Object.keys(dto.action.config).length > 0) {
      try {
        await action.validateInput(dto.action.config);
      } catch (error) {
        throw new BadRequestException(
          `Invalid action configuration: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    const [workflow] = await this.db
      .insert(workflows)
      .values({
        userId,
        name: dto.name,
        description: dto.description,
        triggerProvider: dto.trigger.provider as any,
        triggerId: dto.trigger.triggerId,
        triggerConfig: dto.trigger.config,
        actionProvider: dto.action.provider as any,
        actionId: dto.action.actionId,
        actionConfig: dto.action.config,
        actionCredentialsId: dto.action.credentialsId,
        isActive: false,
      })
      .returning();

    return workflow;
  }

  async getWorkflowById(userId: string, workflowId: number) {
    const [workflow] = await this.db
      .select()
      .from(workflows)
      .where(and(eq(workflows.id, workflowId), eq(workflows.userId, userId)));

    if (!workflow) {
      throw new NotFoundException("Workflow not found");
    }

    return workflow;
  }

  async getUserWorkflows(userId: string) {
    return this.db
      .select()
      .from(workflows)
      .where(eq(workflows.userId, userId))
      .orderBy(desc(workflows.createdAt));
  }

  async updateWorkflow(
    userId: string,
    workflowId: number,
    dto: UpdateWorkflowDto,
  ) {
    const workflow = await this.getWorkflowById(userId, workflowId);

    if (workflow.isActive) {
      throw new BadRequestException(
        "Cannot update an active workflow. Deactivate it first.",
      );
    }

    const updates: any = {};

    if (dto.name !== undefined) {
      updates.name = dto.name;
    }

    if (dto.description !== undefined) {
      updates.description = dto.description;
    }

    if (dto.trigger) {
      const trigger = this.triggerRegistry.get(
        dto.trigger.provider,
        dto.trigger.triggerId,
      );
      if (!trigger) {
        throw new BadRequestException(
          `Trigger not found: ${dto.trigger.provider}:${dto.trigger.triggerId}`,
        );
      }

      try {
        await trigger.validateConfig(dto.trigger.config);
      } catch (error) {
        throw new BadRequestException(
          `Invalid trigger configuration: ${error instanceof Error ? error.message : String(error)}`,
        );
      }

      updates.triggerProvider = dto.trigger.provider;
      updates.triggerId = dto.trigger.triggerId;
      updates.triggerConfig = dto.trigger.config;
    }

    if (dto.action) {
      const action = this.actionRegistry.get(
        dto.action.provider,
        dto.action.actionId,
      );
      if (!action) {
        throw new BadRequestException(
          `Action not found: ${dto.action.provider}:${dto.action.actionId}`,
        );
      }

      try {
        await action.validateInput(dto.action.config);
      } catch (error) {
        throw new BadRequestException(
          `Invalid action configuration: ${error instanceof Error ? error.message : String(error)}`,
        );
      }

      updates.actionProvider = dto.action.provider;
      updates.actionId = dto.action.actionId;
      updates.actionConfig = dto.action.config;
      updates.actionCredentialsId = dto.action.credentialsId;
    }

    updates.updatedAt = new Date();

    const [updated] = await this.db
      .update(workflows)
      .set(updates)
      .where(eq(workflows.id, workflowId))
      .returning();

    return updated;
  }

  async deleteWorkflow(userId: string, workflowId: number) {
    const workflow = await this.getWorkflowById(userId, workflowId);

    if (workflow.isActive) {
      await this.deactivateWorkflow(userId, workflowId);
    }

    await this.db.delete(workflows).where(eq(workflows.id, workflowId));

    return { success: true };
  }

  async activateWorkflow(userId: string, workflowId: number) {
    const workflow = await this.getWorkflowById(userId, workflowId);

    if (workflow.isActive) {
      throw new BadRequestException("Workflow is already active");
    }

    const trigger = this.triggerRegistry.get(
      workflow.triggerProvider,
      workflow.triggerId,
    );
    if (!trigger) {
      throw new BadRequestException("Trigger not found");
    }

    const action = this.actionRegistry.get(
      workflow.actionProvider,
      workflow.actionId,
    );
    if (!action) {
      throw new BadRequestException("Action not found");
    }

    // Validate configurations before activation
    try {
      await trigger.validateConfig(
        (workflow.triggerConfig as Record<string, any>) || {},
      );
    } catch (error) {
      throw new BadRequestException(
        `Cannot activate workflow: Invalid trigger configuration - ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    try {
      await action.validateInput(
        (workflow.actionConfig as Record<string, any>) || {},
      );
    } catch (error) {
      throw new BadRequestException(
        `Cannot activate workflow: Invalid action configuration - ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    // Update status FIRST so that immediate triggers (like On Activation) see the workflow as active
    await this.db
      .update(workflows)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(workflows.id, workflowId));

    try {
      await trigger.register(
        workflowId,
        workflow.triggerConfig as Record<string, any>,
        workflow.actionCredentialsId || undefined,
      );
    } catch (error) {
      // Revert status if registration fails
      await this.db
        .update(workflows)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(workflows.id, workflowId));
      throw error;
    }

    return { success: true };
  }

  async deactivateWorkflow(userId: string, workflowId: number) {
    const workflow = await this.getWorkflowById(userId, workflowId);

    if (!workflow.isActive) {
      throw new BadRequestException("Workflow is not active");
    }

    const trigger = this.triggerRegistry.get(
      workflow.triggerProvider,
      workflow.triggerId,
    );
    if (trigger) {
      await trigger.unregister(workflowId);
    }

    await this.db
      .update(workflows)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(workflows.id, workflowId));

    return { success: true };
  }

  async executeWorkflow(
    userId: string,
    workflowId: number,
    triggerData: Record<string, any> = {},
  ) {
    const workflow = await this.getWorkflowById(userId, workflowId);

    const temporalWorkflowId = `workflow-${workflowId}-${Date.now()}`;

    const input: AutomationWorkflowInput = {
      workflowId: workflow.id,
      userId: workflow.userId,
      triggerProvider: workflow.triggerProvider,
      triggerId: workflow.triggerId,
      triggerData,
      actionProvider: workflow.actionProvider,
      actionId: workflow.actionId,
      actionConfig: workflow.actionConfig as Record<string, any>,
      actionCredentialsId: workflow.actionCredentialsId || undefined,
    };

    const handle = await this.temporalClient.startAutomationWorkflow(
      temporalWorkflowId,
      input,
    );

    const [execution] = await this.db
      .insert(workflowExecutions)
      .values({
        workflowId: workflow.id,
        userId: workflow.userId,
        temporalWorkflowId: handle.workflowId,
        temporalRunId:
          (handle as any).firstExecutionRunId || temporalWorkflowId,
        status: "running",
        triggerData,
        startedAt: new Date(),
      })
      .returning();

    await this.db
      .update(workflows)
      .set({ lastRun: new Date() })
      .where(eq(workflows.id, workflowId));

    return execution;
  }

  async getWorkflowExecutions(userId: string, workflowId: number) {
    await this.getWorkflowById(userId, workflowId);

    return this.db
      .select()
      .from(workflowExecutions)
      .where(eq(workflowExecutions.workflowId, workflowId))
      .orderBy(desc(workflowExecutions.startedAt))
      .limit(50);
  }

  async triggerWorkflowExecution(
    workflowId: number,
    triggerData: Record<string, any>,
  ) {
    const [workflow] = await this.db
      .select()
      .from(workflows)
      .where(eq(workflows.id, workflowId));

    if (!workflow) {
      throw new NotFoundException("Workflow not found");
    }

    if (!workflow.isActive) {
      throw new BadRequestException("Workflow is not active");
    }

    return this.executeWorkflow(workflow.userId, workflowId, triggerData);
  }
}
