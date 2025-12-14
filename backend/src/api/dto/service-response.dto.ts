import { ApiProperty } from "@nestjs/swagger";

export class ActionResponseDto {
  @ApiProperty({
    description: "Action identifier",
    example: "gmail_send_email",
  })
  id: string;

  @ApiProperty({
    description: "Action name",
    example: "Send Email",
  })
  name: string;

  @ApiProperty({
    description: "Action description",
    example: "Sends an email using Gmail",
  })
  description: string;

  @ApiProperty({
    description: "Action type",
    example: "send_email",
  })
  type: string;

  @ApiProperty({
    description: "Input schema for the action",
    example: {
      type: "object",
      properties: {
        to: { type: "string" },
        subject: { type: "string" },
        body: { type: "string" },
      },
    },
  })
  inputSchema: Record<string, any>;

  @ApiProperty({
    description: "Output schema for the action",
    required: false,
    example: {
      type: "object",
      properties: {
        messageId: { type: "string" },
      },
    },
  })
  outputSchema?: Record<string, any>;
}

export class ServiceResponseDto {
  @ApiProperty({
    description: "Service ID",
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: "Service provider identifier",
    example: "gmail",
  })
  provider: string;

  @ApiProperty({
    description: "Service name",
    example: "Gmail",
  })
  name: string;

  @ApiProperty({
    description: "Service description",
    example: "Send and receive emails using Gmail",
  })
  description: string;

  @ApiProperty({
    description: "Service image URL",
    example: "https://example.com/gmail-icon.png",
  })
  imageUrl: string;

  @ApiProperty({
    description: "Service version",
    example: "1.0.0",
  })
  version: string;

  @ApiProperty({
    description: "Supported action types",
    example: ["send_email", "read_email"],
    type: [String],
  })
  supportedActions: string[];

  @ApiProperty({
    description: "Supported credential types",
    example: ["oauth2"],
    type: [String],
  })
  credentialTypes: string[];

  @ApiProperty({
    description: "Available actions for this service",
    type: [ActionResponseDto],
  })
  actions: ActionResponseDto[];
}
