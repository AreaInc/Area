import { ApiProperty } from "@nestjs/swagger";
import { WorkflowNodeDto, WorkflowConnectionDto } from "./create-workflow.dto";

export class WorkflowResponseDto {
  @ApiProperty({
    description: "Workflow ID",
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: "Workflow name",
    example: "My E-commerce Order Flow",
  })
  name: string;

  @ApiProperty({
    description: "Workflow description",
    example: "Processes orders from email",
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: "Workflow version",
    example: 1,
  })
  version: number;

  @ApiProperty({
    description: "Workflow nodes",
    type: [WorkflowNodeDto],
  })
  nodes: WorkflowNodeDto[];

  @ApiProperty({
    description: "Node connections",
    example: {
      node_1: [{ node: "node_2", input: 0, output: 0 }],
    },
  })
  connections: Record<string, WorkflowConnectionDto[]>;

  @ApiProperty({
    description: "Whether the workflow is active",
    example: false,
  })
  isActive: boolean;

  @ApiProperty({
    description: "Last run time",
    example: null,
    required: false,
  })
  lastRun?: Date | null;

  @ApiProperty({
    description: "Creation time",
    example: "2024-01-01T00:00:00Z",
  })
  createdAt: Date;

  @ApiProperty({
    description: "Last update time",
    example: "2024-01-01T00:00:00Z",
  })
  updatedAt: Date;
}

export class WorkflowActivationResponseDto {
  @ApiProperty({
    description: "Workflow ID",
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: "Whether the workflow is active",
    example: true,
  })
  isActive: boolean;
}

export class WorkflowNodeResultDto {
  @ApiProperty({
    description: "Node ID",
    example: "node_1",
  })
  nodeId: string;

  @ApiProperty({
    description: "Whether the node execution was successful",
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: "Node execution result data",
    example: {
      messageId: "xxx",
    },
    required: false,
  })
  data?: Record<string, any>;

  @ApiProperty({
    description: "Node execution status",
    example: "success",
  })
  status: string;
}

export class WorkflowExecutionResponseDto {
  @ApiProperty({
    description: "Execution ID",
    example: 123,
  })
  id: number;

  @ApiProperty({
    description: "Workflow ID",
    example: 1,
  })
  workflowId: number;

  @ApiProperty({
    description: "Execution status",
    example: "success",
  })
  status: string;

  @ApiProperty({
    description: "Input data for the workflow",
    example: {
      email: "test@example.com",
      subject: "New order",
    },
  })
  inputData: Record<string, any>;

  @ApiProperty({
    description: "Output data from the workflow",
    example: {
      node_1: { messageId: "xxx" },
      node_2: { messageId: "yyy" },
    },
  })
  outputData: Record<string, any>;

  @ApiProperty({
    description: "Results for each node",
    example: {
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
  })
  nodeResults: Record<string, WorkflowNodeResultDto>;

  @ApiProperty({
    description: "Error message if execution failed",
    example: null,
    required: false,
  })
  errorMessage?: string | null;

  @ApiProperty({
    description: "Execution start time",
    example: "2024-01-01T00:00:00Z",
  })
  startedAt: Date;

  @ApiProperty({
    description: "Execution completion time",
    example: "2024-01-01T00:00:01Z",
    required: false,
  })
  completedAt?: Date | null;
}

export class WorkflowExecutionHistoryDto {
  @ApiProperty({
    description: "Execution ID",
    example: 123,
  })
  id: number;

  @ApiProperty({
    description: "Workflow ID",
    example: 1,
  })
  workflowId: number;

  @ApiProperty({
    description: "Execution status",
    example: "success",
  })
  status: string;

  @ApiProperty({
    description: "Input data for the workflow",
    example: {
      email: "test@example.com",
      subject: "New order",
    },
  })
  inputData: Record<string, any>;

  @ApiProperty({
    description: "Output data from the workflow",
    example: {
      node_1: { messageId: "xxx" },
      node_2: { messageId: "yyy" },
    },
  })
  outputData: Record<string, any>;

  @ApiProperty({
    description: "Results for each node",
    example: {
      node_1: {
        nodeId: "node_1",
        success: true,
        data: { messageId: "xxx" },
        status: "success",
      },
    },
  })
  nodeResults: Record<string, WorkflowNodeResultDto>;

  @ApiProperty({
    description: "Error message if execution failed",
    example: null,
    required: false,
  })
  errorMessage?: string | null;

  @ApiProperty({
    description: "Execution start time",
    example: "2024-01-01T00:00:00Z",
  })
  startedAt: Date;

  @ApiProperty({
    description: "Execution completion time",
    example: "2024-01-01T00:00:01Z",
    required: false,
  })
  completedAt?: Date | null;

  @ApiProperty({
    description: "Creation time",
    example: "2024-01-01T00:00:00Z",
  })
  createdAt: Date;
}
