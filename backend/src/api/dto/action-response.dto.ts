import { ApiProperty } from "@nestjs/swagger";

export class ActionExecutionResponseDto {
  @ApiProperty({
    description: "Execution ID",
    example: 123,
  })
  executionId: number;

  @ApiProperty({
    description: "Whether the execution was successful",
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: "Execution result data",
    example: {
      messageId: "xxx",
      threadId: "yyy",
    },
    required: false,
  })
  data?: Record<string, any>;

  @ApiProperty({
    description: "Execution status",
    example: "success",
  })
  status: string;
}

export class ActionExecutionHistoryDto {
  @ApiProperty({
    description: "Execution ID",
    example: 123,
  })
  id: number;

  @ApiProperty({
    description: "Service provider",
    example: "gmail",
  })
  serviceProvider: string;

  @ApiProperty({
    description: "Action identifier",
    example: "gmail_send_email",
  })
  actionId: string;

  @ApiProperty({
    description: "Execution status",
    example: "success",
  })
  status: string;

  @ApiProperty({
    description: "Input parameters",
    example: {
      to: "user@example.com",
      subject: "Hello",
      body: "World",
    },
  })
  inputParams: Record<string, any>;

  @ApiProperty({
    description: "Output data",
    example: {
      messageId: "xxx",
      threadId: "yyy",
    },
    required: false,
  })
  outputData?: Record<string, any>;

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
