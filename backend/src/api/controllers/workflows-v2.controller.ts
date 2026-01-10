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
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from '../guards/auth.guard';
import { WorkflowsService } from '../../services/workflows/workflows.service';
import type { CreateWorkflowDto, UpdateWorkflowDto } from '../../services/workflows/workflows.service';
import { TriggerRegistryService } from '../../services/registries/trigger-registry.service';
import { ActionRegistryService } from '../../services/registries/action-registry.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Workflows v2')
@Controller('api/v2/workflows')
@UseGuards(AuthGuard)
export class WorkflowsV2Controller {
  constructor(
    private readonly workflowsService: WorkflowsService,
    private readonly triggerRegistry: TriggerRegistryService,
    private readonly actionRegistry: ActionRegistryService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new workflow' })
  @ApiResponse({ status: 201, description: 'Workflow created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid workflow configuration' })
  async createWorkflow(@Req() req: Request, @Body() dto: CreateWorkflowDto) {
    const user = (req as any).user;

    if (!user || !user.id) {
      throw new BadRequestException('User not authenticated');
    }

    return this.workflowsService.createWorkflow(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all workflows for the current user' })
  @ApiResponse({ status: 200, description: 'List of workflows' })
  async getUserWorkflows(@Req() req: Request) {
    const user = (req as any).user;

    if (!user || !user.id) {
      throw new BadRequestException('User not authenticated');
    }

    return this.workflowsService.getUserWorkflows(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a workflow by ID' })
  @ApiResponse({ status: 200, description: 'Workflow details' })
  @ApiResponse({ status: 404, description: 'Workflow not found' })
  async getWorkflow(@Req() req: Request, @Param('id') id: string) {
    const user = (req as any).user;

    if (!user || !user.id) {
      throw new BadRequestException('User not authenticated');
    }

    return this.workflowsService.getWorkflowById(user.id, parseInt(id));
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a workflow' })
  @ApiResponse({ status: 200, description: 'Workflow updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid workflow configuration' })
  @ApiResponse({ status: 404, description: 'Workflow not found' })
  async updateWorkflow(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateWorkflowDto,
  ) {
    const user = (req as any).user;

    if (!user || !user.id) {
      throw new BadRequestException('User not authenticated');
    }

    return this.workflowsService.updateWorkflow(user.id, parseInt(id), dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a workflow' })
  @ApiResponse({ status: 200, description: 'Workflow deleted successfully' })
  @ApiResponse({ status: 404, description: 'Workflow not found' })
  async deleteWorkflow(@Req() req: Request, @Param('id') id: string) {
    const user = (req as any).user;

    if (!user || !user.id) {
      throw new BadRequestException('User not authenticated');
    }

    return this.workflowsService.deleteWorkflow(user.id, parseInt(id));
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Activate a workflow' })
  @ApiResponse({ status: 200, description: 'Workflow activated successfully' })
  @ApiResponse({ status: 400, description: 'Workflow already active' })
  @ApiResponse({ status: 404, description: 'Workflow not found' })
  async activateWorkflow(@Req() req: Request, @Param('id') id: string) {
    const user = (req as any).user;

    if (!user || !user.id) {
      throw new BadRequestException('User not authenticated');
    }

    return this.workflowsService.activateWorkflow(user.id, parseInt(id));
  }

  @Post(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate a workflow' })
  @ApiResponse({ status: 200, description: 'Workflow deactivated successfully' })
  @ApiResponse({ status: 400, description: 'Workflow not active' })
  @ApiResponse({ status: 404, description: 'Workflow not found' })
  async deactivateWorkflow(@Req() req: Request, @Param('id') id: string) {
    const user = (req as any).user;

    if (!user || !user.id) {
      throw new BadRequestException('User not authenticated');
    }

    return this.workflowsService.deactivateWorkflow(user.id, parseInt(id));
  }

  @Post(':id/execute')
  @ApiOperation({ summary: 'Manually execute a workflow' })
  @ApiResponse({ status: 200, description: 'Workflow execution started' })
  @ApiResponse({ status: 404, description: 'Workflow not found' })
  async executeWorkflow(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { triggerData?: Record<string, any> },
  ) {
    const user = (req as any).user;

    if (!user || !user.id) {
      throw new BadRequestException('User not authenticated');
    }

    return this.workflowsService.executeWorkflow(user.id, parseInt(id), body.triggerData || {});
  }

  @Get(':id/executions')
  @ApiOperation({ summary: 'Get workflow execution history' })
  @ApiResponse({ status: 200, description: 'List of workflow executions' })
  @ApiResponse({ status: 404, description: 'Workflow not found' })
  async getWorkflowExecutions(@Req() req: Request, @Param('id') id: string) {
    const user = (req as any).user;

    if (!user || !user.id) {
      throw new BadRequestException('User not authenticated');
    }

    return this.workflowsService.getWorkflowExecutions(user.id, parseInt(id));
  }

  @Get('metadata/triggers')
  @ApiOperation({ summary: 'Get all available triggers' })
  @ApiResponse({ status: 200, description: 'List of available triggers' })
  async getAvailableTriggers() {
    return this.triggerRegistry.getAllMetadata();
  }

  @Get('metadata/actions')
  @ApiOperation({ summary: 'Get all available actions' })
  @ApiResponse({ status: 200, description: 'List of available actions' })
  async getAvailableActions() {
    return this.actionRegistry.getAllMetadata();
  }
}
