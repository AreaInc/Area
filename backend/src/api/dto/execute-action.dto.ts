import { ApiProperty } from "@nestjs/swagger";

export class ExecuteActionDto {
  @ApiProperty({
    description:
      "Optional credentials ID to use. If not provided, uses the first available credential for the service",
    required: false,
    example: 1,
  })
  credentialsId?: number;

  @ApiProperty({
    description: "Action parameters matching the action's input schema",
    example: { to: "user@example.com", subject: "Hello", body: "World" },
  })
  params: Record<string, any>;
}
