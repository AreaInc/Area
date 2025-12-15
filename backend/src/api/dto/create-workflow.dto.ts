import { ApiProperty } from "@nestjs/swagger";

export class WorkflowNodeDto {
  @ApiProperty({ description: "Node ID", example: "node_1" })
  id: string;

  @ApiProperty({
    description:
      "Node type (e.g., 'gmail:gmail_send_email' or 'gmail_send_email')",
    example: "gmail:gmail_send_email",
  })
  type: string;

  @ApiProperty({
    description: "Node configuration/parameters",
    example: { to: "user@example.com", subject: "Hello", body: "World" },
  })
  config: Record<string, any>;

  @ApiProperty({
    description: "Optional credentials ID to use for this node",
    required: false,
    example: 1,
  })
  credentialsId?: number;
}

export class WorkflowConnectionDto {
  @ApiProperty({ description: "Target node ID", example: "node_2" })
  node: string;

  @ApiProperty({ description: "Input port index", example: 0 })
  input: number;

  @ApiProperty({ description: "Output port index", example: 0 })
  output: number;
}

export class CreateWorkflowDto {
  @ApiProperty({
    description: "Workflow name",
    example: "My E-commerce Order Flow",
  })
  name: string;

  @ApiProperty({
    description: "Workflow description",
    required: false,
    example: "Processes orders from email",
  })
  description?: string;

  @ApiProperty({
    description: "Workflow version",
    required: false,
    default: 1,
    example: 1,
  })
  version?: number;

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
}
