import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpException,
  HttpStatus,
  ParseIntPipe,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { WorkflowsService } from "../../services/workflows-service";
import { WorkflowExecutionService } from "../../services/workflow-execution-service";
import { CreateWorkflowDto } from "../dto/create-workflow.dto";
import { UpdateWorkflowDto } from "../dto/update-workflow.dto";
import { ExecuteWorkflowDto } from "../dto/execute-workflow.dto";
import { AuthGuard } from "../guards/auth.guard";
import { CurrentUser } from "../decorators/user.decorator";
import type { AuthUser } from "../types/user";
import {
  WorkflowResponseDto,
  WorkflowActivationResponseDto,
  WorkflowExecutionResponseDto,
  WorkflowExecutionHistoryDto,
} from "../dto/workflow-response.dto";
import { SuccessResponseDto } from "../dto/credential-response.dto";

@ApiTags("Workflows")
@ApiBearerAuth()
@Controller("api/workflows")
@UseGuards(AuthGuard)
export class WorkflowsController {
  constructor(
    private readonly workflowsService: WorkflowsService,
    private readonly workflowExecutionService: WorkflowExecutionService,
  ) {}

  @Post()
  @ApiOperation({ summary: "Create a new workflow" })
  @ApiBody({ type: CreateWorkflowDto })
  @ApiResponse({
    status: 201,
    description: "Workflow created successfully",
    type: WorkflowResponseDto,
    example: {
      id: 1,
      name: "My E-commerce Order Flow",
      description: "Processes orders from email",
      version: 1,
      nodes: [
        {
          id: "node_1",
          type: "gmail:gmail_read_email",
          config: {
            query: "subject:Order",
            maxResults: 10,
          },
        },
        {
          id: "node_2",
          type: "gmail:gmail_send_email",
          config: {
            to: "customer@example.com",
            subject: "Order Confirmed",
            body: "Your order has been processed",
          },
          credentialsId: 1,
        },
      ],
      connections: {
        node_1: [{ node: "node_2", input: 0, output: 0 }],
      },
      isActive: false,
      lastRun: null,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    },
  })
  @ApiResponse({ status: 400, description: "Invalid request data" })
  async createWorkflow(
    @CurrentUser() user: AuthUser,
    @Body() createDto: CreateWorkflowDto,
  ) {
    const workflow = await this.workflowsService.createWorkflow(
      String(user.id),
      {
        name: createDto.name,
        description: createDto.description,
        version: createDto.version || 1,
        nodes: createDto.nodes,
        connections: createDto.connections,
      },
    );

    return {
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
      version: workflow.version,
      nodes: workflow.nodes,
      connections: workflow.connections,
      isActive: workflow.isActive,
      lastRun: workflow.lastRun,
      createdAt: workflow.createdAt,
      updatedAt: workflow.updatedAt,
    };
  }

  @Get()
  @ApiOperation({ summary: "Get all workflows for the current user" })
  @ApiResponse({
    status: 200,
    description: "List of workflows",
    type: [WorkflowResponseDto],
    example: [
      {
        id: 1,
        name: "My E-commerce Order Flow",
        description: "Processes orders from email",
        version: 1,
        nodes: [
          {
            id: "node_1",
            type: "gmail:gmail_read_email",
            config: {
              query: "subject:Order",
              maxResults: 10,
            },
          },
        ],
        connections: {
          node_1: [{ node: "node_2", input: 0, output: 0 }],
        },
        isActive: false,
        lastRun: null,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      },
    ],
  })
  async getWorkflows(@CurrentUser() user: AuthUser) {
    const workflows = await this.workflowsService.getUserWorkflows(
      String(user.id),
    );

    return workflows.map((w) => ({
      id: w.id,
      name: w.name,
      description: w.description,
      version: w.version,
      nodes: w.nodes,
      connections: w.connections,
      isActive: w.isActive,
      lastRun: w.lastRun,
      createdAt: w.createdAt,
      updatedAt: w.updatedAt,
    }));
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a workflow by ID" })
  @ApiParam({ name: "id", description: "Workflow ID" })
  @ApiResponse({
    status: 200,
    description: "Workflow details",
    type: WorkflowResponseDto,
    example: {
      id: 1,
      name: "My E-commerce Order Flow",
      description: "Processes orders from email",
      version: 1,
      nodes: [
        {
          id: "node_1",
          type: "gmail:gmail_read_email",
          config: {
            query: "subject:Order",
            maxResults: 10,
          },
        },
        {
          id: "node_2",
          type: "gmail:gmail_send_email",
          config: {
            to: "customer@example.com",
            subject: "Order Confirmed",
            body: "Your order has been processed",
          },
          credentialsId: 1,
        },
      ],
      connections: {
        node_1: [{ node: "node_2", input: 0, output: 0 }],
      },
      isActive: false,
      lastRun: null,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    },
  })
  @ApiResponse({ status: 404, description: "Workflow not found" })
  async getWorkflow(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseIntPipe) id: number,
  ) {
    const workflow = await this.workflowsService.getWorkflowById(
      id,
      String(user.id),
    );

    if (!workflow) {
      throw new HttpException("Workflow not found", HttpStatus.NOT_FOUND);
    }

    return {
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
      version: workflow.version,
      nodes: workflow.nodes,
      connections: workflow.connections,
      isActive: workflow.isActive,
      lastRun: workflow.lastRun,
      createdAt: workflow.createdAt,
      updatedAt: workflow.updatedAt,
    };
  }

  @Put(":id")
  @ApiOperation({ summary: "Update a workflow" })
  @ApiParam({ name: "id", description: "Workflow ID" })
  @ApiBody({ type: UpdateWorkflowDto })
  @ApiResponse({
    status: 200,
    description: "Workflow updated successfully",
    type: WorkflowResponseDto,
    example: {
      id: 1,
      name: "My Updated E-commerce Order Flow",
      description: "Processes orders from email",
      version: 1,
      nodes: [
        {
          id: "node_1",
          type: "gmail:gmail_read_email",
          config: {
            query: "subject:Order",
            maxResults: 10,
          },
        },
      ],
      connections: {
        node_1: [{ node: "node_2", input: 0, output: 0 }],
      },
      isActive: false,
      lastRun: null,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:01Z",
    },
  })
  @ApiResponse({ status: 404, description: "Workflow not found" })
  async updateWorkflow(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateWorkflowDto,
  ) {
    const workflow = await this.workflowsService.updateWorkflow(
      id,
      String(user.id),
      updateDto,
    );

    if (!workflow) {
      throw new HttpException("Workflow not found", HttpStatus.NOT_FOUND);
    }

    return {
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
      version: workflow.version,
      nodes: workflow.nodes,
      connections: workflow.connections,
      isActive: workflow.isActive,
      lastRun: workflow.lastRun,
      createdAt: workflow.createdAt,
      updatedAt: workflow.updatedAt,
    };
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a workflow" })
  @ApiParam({ name: "id", description: "Workflow ID" })
  @ApiResponse({
    status: 200,
    description: "Workflow deleted successfully",
    type: SuccessResponseDto,
    example: {
      success: true,
    },
  })
  @ApiResponse({ status: 404, description: "Workflow not found" })
  async deleteWorkflow(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseIntPipe) id: number,
  ) {
    const deleted = await this.workflowsService.deleteWorkflow(
      id,
      String(user.id),
    );

    if (!deleted) {
      throw new HttpException("Workflow not found", HttpStatus.NOT_FOUND);
    }

    return { success: true };
  }

  @Post(":id/activate")
  @ApiOperation({ summary: "Activate a workflow" })
  @ApiParam({ name: "id", description: "Workflow ID" })
  @ApiResponse({
    status: 200,
    description: "Workflow activated",
    type: WorkflowActivationResponseDto,
    example: {
      id: 1,
      isActive: true,
    },
  })
  @ApiResponse({ status: 404, description: "Workflow not found" })
  async activateWorkflow(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseIntPipe) id: number,
  ) {
    const workflow = await this.workflowsService.setWorkflowActive(
      id,
      String(user.id),
      true,
    );

    if (!workflow) {
      throw new HttpException("Workflow not found", HttpStatus.NOT_FOUND);
    }

    return {
      id: workflow.id,
      isActive: workflow.isActive,
    };
  }

  @Post(":id/deactivate")
  @ApiOperation({ summary: "Deactivate a workflow" })
  @ApiParam({ name: "id", description: "Workflow ID" })
  @ApiResponse({
    status: 200,
    description: "Workflow deactivated",
    type: WorkflowActivationResponseDto,
    example: {
      id: 1,
      isActive: false,
    },
  })
  @ApiResponse({ status: 404, description: "Workflow not found" })
  async deactivateWorkflow(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseIntPipe) id: number,
  ) {
    const workflow = await this.workflowsService.setWorkflowActive(
      id,
      String(user.id),
      false,
    );

    if (!workflow) {
      throw new HttpException("Workflow not found", HttpStatus.NOT_FOUND);
    }

    return {
      id: workflow.id,
      isActive: workflow.isActive,
    };
  }

  @Post(":id/execute")
  @ApiOperation({ summary: "Execute a workflow" })
  @ApiParam({ name: "id", description: "Workflow ID" })
  @ApiBody({ type: ExecuteWorkflowDto })
  @ApiResponse({
    status: 200,
    description: "Workflow execution started",
    type: WorkflowExecutionResponseDto,
    example: {
      id: 123,
      workflowId: 1,
      status: "success",
      inputData: {
        email: "test@example.com",
        subject: "New order",
      },
      outputData: {
        node_1: { messageId: "xxx" },
        node_2: { messageId: "yyy" },
      },
      nodeResults: {
        node_1: {
          nodeId: "node_1",
          success: true,
          data: { messageId: "xxx" },
          status: "success",
        },
        node_2: {
          nodeId: "node_2",
          success: true,
          data: { messageId: "yyy" },
          status: "success",
        },
      },
      errorMessage: null,
      startedAt: "2024-01-01T00:00:00Z",
      completedAt: "2024-01-01T00:00:01Z",
    },
  })
  @ApiResponse({ status: 404, description: "Workflow not found" })
  async executeWorkflow(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseIntPipe) id: number,
    @Body() executeDto: ExecuteWorkflowDto,
  ) {
    try {
      const execution = await this.workflowExecutionService.executeWorkflow(
        id,
        String(user.id),
        executeDto.triggerData,
      );

      return {
        id: execution.id,
        workflowId: execution.workflowId,
        status: execution.status,
        inputData: execution.inputData,
        outputData: execution.outputData,
        nodeResults: execution.nodeResults,
        errorMessage: execution.errorMessage,
        startedAt: execution.startedAt,
        completedAt: execution.completedAt,
      };
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : "Failed to execute workflow",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(":id/executions")
  @ApiOperation({ summary: "Get workflow execution history" })
  @ApiParam({ name: "id", description: "Workflow ID" })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Maximum number of executions to return",
  })
  @ApiResponse({
    status: 200,
    description: "List of executions",
    type: [WorkflowExecutionHistoryDto],
    example: [
      {
        id: 123,
        workflowId: 1,
        status: "success",
        inputData: {
          email: "test@example.com",
          subject: "New order",
        },
        outputData: {
          node_1: { messageId: "xxx" },
          node_2: { messageId: "yyy" },
        },
        nodeResults: {
          node_1: {
            nodeId: "node_1",
            success: true,
            data: { messageId: "xxx" },
            status: "success",
          },
        },
        errorMessage: null,
        startedAt: "2024-01-01T00:00:00Z",
        completedAt: "2024-01-01T00:00:01Z",
        createdAt: "2024-01-01T00:00:00Z",
      },
    ],
  })
  async getWorkflowExecutions(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseIntPipe) id: number,
    @Query("limit") limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    const executions =
      await this.workflowExecutionService.getWorkflowExecutions(
        id,
        String(user.id),
        limitNum,
      );

    return executions.map((exec) => ({
      id: exec.id,
      workflowId: exec.workflowId,
      status: exec.status,
      inputData: exec.inputData,
      outputData: exec.outputData,
      nodeResults: exec.nodeResults,
      errorMessage: exec.errorMessage,
      startedAt: exec.startedAt,
      completedAt: exec.completedAt,
      createdAt: exec.createdAt,
    }));
  }
}
