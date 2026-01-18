import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import type { Request } from "express";
import { AuthGuard } from "../guards/auth.guard";
import { WorkflowsService } from "../../services/workflows/workflows.service";
import type {
  CreateWorkflowDto as ServiceCreateWorkflowDto,
  UpdateWorkflowDto as ServiceUpdateWorkflowDto,
} from "../../services/workflows/workflows.service";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from "@nestjs/swagger";
import {
  CreateWorkflowDto,
  UpdateWorkflowDto,
  ExecuteWorkflowDto,
  WorkflowResponseDto,
  WorkflowExecutionResponseDto,
  SuccessResponseDto,
} from "../dtos";

@ApiTags("Workflows v2")
@ApiBearerAuth()
@Controller("api/v2/workflows")
@UseGuards(AuthGuard)
export class WorkflowsV2Controller {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @Post()
  @ApiOperation({
    summary: "Create a new workflow",
    description:
      "Creates a new automation workflow with a trigger and action. The workflow must be activated separately after creation.",
  })
  @ApiBody({ type: CreateWorkflowDto })
  @ApiResponse({
    status: 201,
    description: "Workflow created successfully",
    type: WorkflowResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      "Invalid workflow configuration - trigger or action not found, or validation failed",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async createWorkflow(@Req() req: Request, @Body() dto: CreateWorkflowDto) {
    const user = (req as any).user;

    if (!user || !user.id) {
      throw new BadRequestException("User not authenticated");
    }

    // Convert to service DTO
    const serviceDto: ServiceCreateWorkflowDto = {
      name: dto.name,
      description: dto.description,
      trigger: {
        provider: dto.trigger.provider,
        triggerId: dto.trigger.triggerId,
        config: dto.trigger.config,
      },
      action: {
        provider: dto.action.provider,
        actionId: dto.action.actionId,
        config: dto.action.config,
        credentialsId: dto.action.credentialsId,
      },
    };

    return this.workflowsService.createWorkflow(user.id, serviceDto);
  }

  @Get()
  @ApiOperation({
    summary: "Get all workflows for the current user",
    description:
      "Returns a list of all workflows belonging to the authenticated user, ordered by creation date (newest first).",
  })
  @ApiResponse({
    status: 200,
    description: "List of workflows",
    type: [WorkflowResponseDto],
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async getUserWorkflows(@Req() req: Request) {
    const user = (req as any).user;

    if (!user || !user.id) {
      throw new BadRequestException("User not authenticated");
    }

    return this.workflowsService.getUserWorkflows(user.id);
  }

  @Get(":id")
  @ApiOperation({
    summary: "Get a workflow by ID",
    description:
      "Retrieves detailed information about a specific workflow. Only workflows belonging to the authenticated user can be accessed.",
  })
  @ApiParam({
    name: "id",
    description: "Workflow ID",
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: "Workflow details",
    type: WorkflowResponseDto,
  })
  @ApiResponse({ status: 404, description: "Workflow not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async getWorkflow(@Req() req: Request, @Param("id") id: string) {
    const user = (req as any).user;

    if (!user || !user.id) {
      throw new BadRequestException("User not authenticated");
    }

    return this.workflowsService.getWorkflowById(user.id, parseInt(id));
  }

  @Put(":id")
  @ApiOperation({
    summary: "Update a workflow",
    description:
      "Updates an existing workflow. The workflow must be deactivated before it can be updated. All fields are optional - only provided fields will be updated.",
  })
  @ApiParam({
    name: "id",
    description: "Workflow ID",
    type: Number,
    example: 1,
  })
  @ApiBody({ type: UpdateWorkflowDto })
  @ApiResponse({
    status: 200,
    description: "Workflow updated successfully",
    type: WorkflowResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      "Invalid workflow configuration or workflow is active (must deactivate first)",
  })
  @ApiResponse({ status: 404, description: "Workflow not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async updateWorkflow(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() dto: UpdateWorkflowDto,
  ) {
    const user = (req as any).user;

    if (!user || !user.id) {
      throw new BadRequestException("User not authenticated");
    }

    // Convert to service DTO
    const serviceDto: ServiceUpdateWorkflowDto = {};
    if (dto.name !== undefined) serviceDto.name = dto.name;
    if (dto.description !== undefined) serviceDto.description = dto.description;
    if (dto.trigger) {
      serviceDto.trigger = {
        provider: dto.trigger.provider,
        triggerId: dto.trigger.triggerId,
        config: dto.trigger.config,
      };
    }
    if (dto.action) {
      serviceDto.action = {
        provider: dto.action.provider,
        actionId: dto.action.actionId,
        config: dto.action.config,
        credentialsId: dto.action.credentialsId,
      };
    }

    return this.workflowsService.updateWorkflow(
      user.id,
      parseInt(id),
      serviceDto,
    );
  }

  @Delete(":id")
  @ApiOperation({
    summary: "Delete a workflow",
    description:
      "Permanently deletes a workflow. If the workflow is active, it will be automatically deactivated before deletion.",
  })
  @ApiParam({
    name: "id",
    description: "Workflow ID",
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: "Workflow deleted successfully",
    type: SuccessResponseDto,
  })
  @ApiResponse({ status: 404, description: "Workflow not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async deleteWorkflow(@Req() req: Request, @Param("id") id: string) {
    const user = (req as any).user;

    if (!user || !user.id) {
      throw new BadRequestException("User not authenticated");
    }

    return this.workflowsService.deleteWorkflow(user.id, parseInt(id));
  }

  @Post(":id/activate")
  @ApiOperation({
    summary: "Activate a workflow",
    description:
      "Activates a workflow, registering its trigger with the trigger manager. Once activated, the workflow will automatically execute when its trigger fires.",
  })
  @ApiParam({
    name: "id",
    description: "Workflow ID",
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: "Workflow activated successfully",
    type: SuccessResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Workflow already active or trigger not found",
  })
  @ApiResponse({ status: 404, description: "Workflow not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async activateWorkflow(@Req() req: Request, @Param("id") id: string) {
    const user = (req as any).user;

    if (!user || !user.id) {
      throw new BadRequestException("User not authenticated");
    }

    return this.workflowsService.activateWorkflow(user.id, parseInt(id));
  }

  @Post(":id/deactivate")
  @ApiOperation({
    summary: "Deactivate a workflow",
    description:
      "Deactivates a workflow, unregistering its trigger. Once deactivated, the workflow will no longer execute automatically when its trigger fires.",
  })
  @ApiParam({
    name: "id",
    description: "Workflow ID",
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: "Workflow deactivated successfully",
    type: SuccessResponseDto,
  })
  @ApiResponse({ status: 400, description: "Workflow not active" })
  @ApiResponse({ status: 404, description: "Workflow not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async deactivateWorkflow(@Req() req: Request, @Param("id") id: string) {
    const user = (req as any).user;

    if (!user || !user.id) {
      throw new BadRequestException("User not authenticated");
    }

    return this.workflowsService.deactivateWorkflow(user.id, parseInt(id));
  }

  @Post(":id/execute")
  @ApiOperation({
    summary: "Manually execute a workflow",
    description:
      "Manually triggers a workflow execution. This starts a Temporal workflow with the provided trigger data. Useful for testing workflows or triggering them programmatically.",
  })
  @ApiParam({
    name: "id",
    description: "Workflow ID",
    type: Number,
    example: 1,
  })
  @ApiBody({ type: ExecuteWorkflowDto })
  @ApiResponse({
    status: 200,
    description: "Workflow execution started",
    type: WorkflowExecutionResponseDto,
  })
  @ApiResponse({ status: 404, description: "Workflow not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async executeWorkflow(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() body: ExecuteWorkflowDto,
  ) {
    const user = (req as any).user;

    if (!user || !user.id) {
      throw new BadRequestException("User not authenticated");
    }

    return this.workflowsService.executeWorkflow(
      user.id,
      parseInt(id),
      body.triggerData || {},
    );
  }

  @Get(":id/executions")
  @ApiOperation({
    summary: "Get workflow execution history",
    description:
      "Retrieves the execution history for a workflow, including all past runs with their status, trigger data, action results, and error messages. Returns up to 50 most recent executions.",
  })
  @ApiParam({
    name: "id",
    description: "Workflow ID",
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: "List of workflow executions",
    type: [WorkflowExecutionResponseDto],
  })
  @ApiResponse({ status: 404, description: "Workflow not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async getWorkflowExecutions(@Req() req: Request, @Param("id") id: string) {
    const user = (req as any).user;

    if (!user || !user.id) {
      throw new BadRequestException("User not authenticated");
    }

    return this.workflowsService.getWorkflowExecutions(user.id, parseInt(id));
  }
}
