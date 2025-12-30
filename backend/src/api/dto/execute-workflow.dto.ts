import { ApiProperty } from "@nestjs/swagger";

export class ExecuteWorkflowDto {
  @ApiProperty({
    description: "Optional trigger data to pass to the workflow",
    required: false,
    example: { email: "test@example.com", subject: "New order" },
  })
  triggerData?: Record<string, any>;
}
