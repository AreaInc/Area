import { Injectable, Inject } from "@nestjs/common";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { eq, and } from "drizzle-orm";
import { DRIZZLE } from "../db/drizzle.module";
import * as schema from "../db/schema";
import { ServiceRegistry } from "./service-registry";
import { CredentialsService } from "./credentials-service";
import {
  WorkflowsService,
  WorkflowNode,
  WorkflowConnection,
} from "./workflows-service";
import { ExecutionStatus } from "../common/types/enums";
import { BaseService } from "../common/base/base-service";

interface NodeExecutionResult {
  nodeId: string;
  success: boolean;
  data?: any;
  error?: string;
  status: ExecutionStatus;
}

@Injectable()
export class WorkflowExecutionService {
  constructor(
    @Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>,
    private serviceRegistry: ServiceRegistry,
    private credentialsService: CredentialsService,
    private workflowsService: WorkflowsService,
  ) {}

  async executeWorkflow(
    workflowId: number,
    userId: string,
    triggerData?: Record<string, any>,
  ): Promise<typeof schema.workflowExecutions.$inferSelect> {
    const workflow = await this.workflowsService.getWorkflowById(
      workflowId,
      userId,
    );

    if (!workflow) {
      throw new Error("Workflow not found");
    }

    const [execution] = await this.db
      .insert(schema.workflowExecutions)
      .values({
        workflowId,
        userId,
        status: ExecutionStatus.RUNNING,
        inputData: triggerData || null,
        nodeResults: {},
      })
      .returning();

    try {
      const nodes = workflow.nodes as WorkflowNode[];
      const connections = workflow.connections as Record<
        string,
        WorkflowConnection[]
      >;

      const nodeMap = new Map<string, WorkflowNode>();
      const incomingCount = new Map<string, number>();
      const nodeOutputs = new Map<string, unknown>();

      nodes.forEach((node) => {
        nodeMap.set(node.id, node);
        incomingCount.set(node.id, 0);
      });

      Object.entries(connections).forEach(([, conns]) => {
        conns.forEach((conn) => {
          const current = incomingCount.get(conn.node) || 0;
          incomingCount.set(conn.node, current + 1);
        });
      });

      const queue: string[] = [];
      incomingCount.forEach((count, nodeId) => {
        if (count === 0) {
          queue.push(nodeId);
        }
      });

      const executionResults: Record<string, NodeExecutionResult> = {};

      while (queue.length > 0) {
        const currentNodeId = queue.shift()!;
        const currentNode = nodeMap.get(currentNodeId)!;

        const inputData: Record<string, unknown> = {};

        Object.entries(connections).forEach(([sourceNodeId, conns]) => {
          const connection = conns.find((c) => c.node === currentNodeId);
          if (connection) {
            const sourceOutput = nodeOutputs.get(sourceNodeId);
            if (sourceOutput) {
              Object.assign(inputData, sourceOutput as Record<string, unknown>);
            }
          }
        });

        if (incomingCount.get(currentNodeId) === 0 && triggerData) {
          Object.assign(inputData, triggerData);
        }

        const params = { ...inputData, ...currentNode.config };

        const nodeResult = await this.executeNode(currentNode, params, userId);

        executionResults[currentNodeId] = nodeResult;
        nodeOutputs.set(currentNodeId, nodeResult.data || {});

        const outgoingConnections = connections[currentNodeId] || [];
        outgoingConnections.forEach((conn) => {
          const current = incomingCount.get(conn.node) || 0;
          incomingCount.set(conn.node, current - 1);
          if (incomingCount.get(conn.node) === 0) {
            queue.push(conn.node);
          }
        });
      }

      const allSuccessful = Object.values(executionResults).every(
        (r) => r.success,
      );
      const finalStatus = allSuccessful
        ? ExecutionStatus.SUCCESS
        : ExecutionStatus.FAILED;

      const finalOutput: Record<string, unknown> = {};
      nodes.forEach((node) => {
        const result = executionResults[node.id];
        if (result && result.data) {
          finalOutput[node.id] = result.data as unknown;
        }
      });

      const [updatedExecution] = await this.db
        .update(schema.workflowExecutions)
        .set({
          status: finalStatus,
          outputData: finalOutput,
          nodeResults: executionResults,
          completedAt: new Date(),
          errorMessage: allSuccessful
            ? null
            : Object.values(executionResults)
                .filter((r) => !r.success)
                .map((r) => r.error)
                .join("; "),
        })
        .where(eq(schema.workflowExecutions.id, execution.id))
        .returning();

      await this.workflowsService.updateLastRun(workflowId);

      return updatedExecution;
    } catch (error) {
      await this.db
        .update(schema.workflowExecutions)
        .set({
          status: ExecutionStatus.FAILED,
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
          completedAt: new Date(),
        })
        .where(eq(schema.workflowExecutions.id, execution.id));

      throw error;
    }
  }

  private async executeNode(
    node: WorkflowNode,
    params: Record<string, any>,
    userId: string,
  ): Promise<NodeExecutionResult> {
    try {
      const [serviceProvider, actionId] = node.type.includes(":")
        ? node.type.split(":", 2)
        : [null, node.type];

      let serviceInstance: BaseService | undefined;
      let finalActionId = actionId;

      if (serviceProvider) {
        serviceInstance = this.serviceRegistry.get(
          serviceProvider as unknown as import("../common/types/enums").ServiceProvider,
        );
        if (!serviceInstance) {
          return {
            nodeId: node.id,
            success: false,
            error: `Service ${serviceProvider} not found`,
            status: ExecutionStatus.FAILED,
          };
        }
      } else {
        const allServices = this.serviceRegistry.getAll();
        for (const service of allServices) {
          const action = service.getAction(actionId);
          if (action) {
            serviceInstance = service;
            finalActionId = actionId;
            break;
          }
        }

        if (!serviceInstance) {
          return {
            nodeId: node.id,
            success: false,
            error: `Action ${actionId} not found in any service`,
            status: ExecutionStatus.FAILED,
          };
        }
      }

      let credentials: import("../common/base/base-credentials").BaseCredentials;
      if (node.credentialsId) {
        const cred = await this.credentialsService.getCredentialsById(
          node.credentialsId,
        );
        if (!cred || cred.userId !== userId) {
          return {
            nodeId: node.id,
            success: false,
            error: "Credentials not found or access denied",
            status: ExecutionStatus.FAILED,
          };
        }
        credentials = cred;
      } else {
        const serviceProviderEnum = serviceInstance.getProvider();
        const userCredentials =
          await this.credentialsService.getUserServiceCredentials(
            userId,
            serviceProviderEnum,
          );
        if (userCredentials.length === 0) {
          return {
            nodeId: node.id,
            success: false,
            error: "No credentials found for this service",
            status: ExecutionStatus.FAILED,
          };
        }
        credentials = userCredentials[0];
      }

      const credentialsIdStr: string | undefined = credentials.id ?? undefined;

      const result = await serviceInstance.executeAction(
        finalActionId,
        params,
        credentialsIdStr,
      );

      return {
        nodeId: node.id,
        success: result.success,
        data: result.data as unknown,
        error: result.error,
        status: result.status,
      };
    } catch (error) {
      return {
        nodeId: node.id,
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        status: ExecutionStatus.FAILED,
      };
    }
  }

  async getWorkflowExecutions(workflowId: number, userId: string, limit = 50) {
    return this.db
      .select()
      .from(schema.workflowExecutions)
      .where(
        and(
          eq(schema.workflowExecutions.workflowId, workflowId),
          eq(schema.workflowExecutions.userId, userId),
        ),
      )
      .orderBy(schema.workflowExecutions.startedAt)
      .limit(limit);
  }

  async getExecutionById(
    executionId: number,
    userId: string,
  ): Promise<typeof schema.workflowExecutions.$inferSelect | null> {
    const [execution] = await this.db
      .select()
      .from(schema.workflowExecutions)
      .where(
        and(
          eq(schema.workflowExecutions.id, executionId),
          eq(schema.workflowExecutions.userId, userId),
        ),
      )
      .limit(1);

    return execution || null;
  }
}
