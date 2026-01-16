import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class TriggerConfigDto {
  @ApiProperty({
    description: "Service provider for the trigger (e.g., 'gmail', 'slack')",
    example: "gmail",
  })
  provider: string;

  @ApiProperty({
    description: "Trigger identifier (e.g., 'receive-email')",
    example: "receive-email",
  })
  triggerId: string;

  @ApiProperty({
    description: "Trigger configuration as JSON object",
    example: { from: "boss@company.com" },
    type: Object,
  })
  config: Record<string, any>;
}

export class ActionConfigDto {
  @ApiProperty({
    description: "Service provider for the action (e.g., 'gmail', 'slack')",
    example: "gmail",
  })
  provider: string;

  @ApiProperty({
    description: "Action identifier (e.g., 'send-email')",
    example: "send-email",
  })
  actionId: string;

  @ApiProperty({
    description: "Action configuration as JSON object",
    example: { to: "personal@gmail.com", subject: "Forwarded email" },
    type: Object,
  })
  config: Record<string, any>;

  @ApiPropertyOptional({
    description: "ID of the credentials to use for this action",
    example: 123,
  })
  credentialsId?: number;
}

export class CreateWorkflowDto {
  @ApiProperty({
    description: "Workflow name",
    example: "Forward Emails",
  })
  name: string;

  @ApiPropertyOptional({
    description: "Workflow description",
    example: "Forwards emails from boss to personal email",
  })
  description?: string;

  @ApiProperty({
    description: "Trigger configuration",
    type: TriggerConfigDto,
  })
  trigger: TriggerConfigDto;

  @ApiProperty({
    description: "Action configuration",
    type: ActionConfigDto,
  })
  action: ActionConfigDto;
}

export class UpdateWorkflowDto {
  @ApiPropertyOptional({
    description: "Workflow name",
    example: "Forward Emails Updated",
  })
  name?: string;

  @ApiPropertyOptional({
    description: "Workflow description",
    example: "Updated description",
  })
  description?: string;

  @ApiPropertyOptional({
    description: "Trigger configuration",
    type: TriggerConfigDto,
  })
  trigger?: TriggerConfigDto;

  @ApiPropertyOptional({
    description: "Action configuration",
    type: ActionConfigDto,
  })
  action?: ActionConfigDto;
}

export class ExecuteWorkflowDto {
  @ApiPropertyOptional({
    description: "Optional trigger data to pass to the workflow",
    example: { messageId: "123", from: "test@example.com" },
    type: Object,
  })
  triggerData?: Record<string, any>;
}

export class WorkflowResponseDto {
  @ApiProperty({ description: "Workflow ID", example: 1 })
  id: number;

  @ApiProperty({ description: "User ID", example: "user_123" })
  userId: string;

  @ApiProperty({ description: "Workflow name", example: "Forward Emails" })
  name: string;

  @ApiPropertyOptional({
    description: "Workflow description",
    example: "Forwards emails",
  })
  description?: string | null;

  @ApiProperty({ description: "Trigger provider", example: "gmail" })
  triggerProvider: string;

  @ApiProperty({ description: "Trigger ID", example: "receive-email" })
  triggerId: string;

  @ApiProperty({ description: "Trigger configuration", type: Object })
  triggerConfig: Record<string, any>;

  @ApiProperty({ description: "Action provider", example: "gmail" })
  actionProvider: string;

  @ApiProperty({ description: "Action ID", example: "send-email" })
  actionId: string;

  @ApiProperty({ description: "Action configuration", type: Object })
  actionConfig: Record<string, any>;

  @ApiPropertyOptional({ description: "Action credentials ID", example: 123 })
  actionCredentialsId?: number | null;

  @ApiProperty({
    description: "Whether the workflow is active",
    example: false,
  })
  isActive: boolean;

  @ApiPropertyOptional({ description: "Last run timestamp" })
  lastRun?: Date | null;

  @ApiProperty({ description: "Creation timestamp" })
  createdAt: Date;

  @ApiProperty({ description: "Last update timestamp" })
  updatedAt: Date;
}

export class WorkflowExecutionResponseDto {
  @ApiProperty({ description: "Execution ID", example: 1 })
  id: number;

  @ApiProperty({ description: "Workflow ID", example: 1 })
  workflowId: number;

  @ApiProperty({ description: "User ID", example: "user_123" })
  userId: string;

  @ApiProperty({
    description: "Temporal workflow ID",
    example: "workflow-1-1234567890",
  })
  temporalWorkflowId: string;

  @ApiProperty({ description: "Temporal run ID", example: "run-123" })
  temporalRunId: string;

  @ApiProperty({
    description: "Execution status",
    example: "running",
    enum: ["running", "completed", "failed", "cancelled"],
  })
  status: string;

  @ApiPropertyOptional({ description: "Trigger data", type: Object })
  triggerData?: Record<string, any> | null;

  @ApiPropertyOptional({ description: "Action result", type: Object })
  actionResult?: Record<string, any> | null;

  @ApiPropertyOptional({ description: "Error message if execution failed" })
  errorMessage?: string | null;

  @ApiProperty({ description: "Start timestamp" })
  startedAt: Date;

  @ApiPropertyOptional({ description: "Completion timestamp" })
  completedAt?: Date | null;

  @ApiProperty({ description: "Creation timestamp" })
  createdAt: Date;
}

export class TriggerMetadataResponseDto {
  @ApiProperty({ description: "Trigger ID", example: "receive-email" })
  id: string;

  @ApiProperty({ description: "Trigger name", example: "Receive Email" })
  name: string;

  @ApiProperty({ description: "Trigger description" })
  description: string;

  @ApiProperty({ description: "Service provider", example: "gmail" })
  serviceProvider: string;

  @ApiProperty({ description: "Trigger type", example: "event" })
  triggerType: string;

  @ApiProperty({ description: "Configuration schema", type: Object })
  configSchema: Record<string, any>;

  @ApiPropertyOptional({ description: "Output schema", type: Object })
  outputSchema?: Record<string, any>;

  @ApiProperty({
    description: "Whether credentials are required",
    example: false,
  })
  requiresCredentials: boolean;
}

export class ActionMetadataResponseDto {
  @ApiProperty({ description: "Action ID", example: "send-email" })
  id: string;

  @ApiProperty({ description: "Action name", example: "Send Email" })
  name: string;

  @ApiProperty({ description: "Action description" })
  description: string;

  @ApiProperty({ description: "Service provider", example: "gmail" })
  serviceProvider: string;

  @ApiProperty({ description: "Input schema", type: Object })
  inputSchema: Record<string, any>;

  @ApiPropertyOptional({ description: "Output schema", type: Object })
  outputSchema?: Record<string, any>;

  @ApiProperty({
    description: "Whether credentials are required",
    example: true,
  })
  requiresCredentials: boolean;
}

export class SuccessResponseDto {
  @ApiProperty({ description: "Success status", example: true })
  success: boolean;

  @ApiPropertyOptional({ description: "Success message" })
  message?: string;
}
