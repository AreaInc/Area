import { ApiProperty } from "@nestjs/swagger";
import { WorkflowNodeDto, WorkflowConnectionDto } from "./create-workflow.dto";

export class UpdateWorkflowDto {
  @ApiProperty({
    description: "Workflow name",
    required: false,
    example: "My Updated Workflow",
  })
  name?: string;

  @ApiProperty({
    description: "Workflow description",
    required: false,
    example: "Updated description",
  })
  description?: string;

  @ApiProperty({
    description: "Workflow version",
    required: false,
    example: 2,
  })
  version?: number;

  @ApiProperty({
    description: "Workflow nodes",
    required: false,
    type: [WorkflowNodeDto],
  })
  nodes?: WorkflowNodeDto[];

  @ApiProperty({
    description: "Node connections",
    required: false,
    example: {
      node_1: [{ node: "node_2", input: 0, output: 0 }],
    },
  })
  connections?: Record<string, WorkflowConnectionDto[]>;
}
