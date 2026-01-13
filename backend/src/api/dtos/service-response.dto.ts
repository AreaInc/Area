import { ApiProperty } from "@nestjs/swagger";

export class ActionResponseDto {
  @ApiProperty({ example: "gmail_send_email" })
  id: string;

  @ApiProperty({ example: "Send Email" })
  name: string;

  @ApiProperty({ example: "Sends an email using Gmail" })
  description: string;

  @ApiProperty({ example: "send_email" })
  type: string;

  @ApiProperty({
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
    example: {
      type: "object",
      properties: {
        messageId: { type: "string" },
      },
    },
    required: false,
  })
  outputSchema?: Record<string, any>;
}

export class ServiceResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: "gmail" })
  provider: string;

  @ApiProperty({ example: "Gmail" })
  name: string;

  @ApiProperty({ example: "Send and receive emails using Gmail" })
  description: string;

  @ApiProperty({ example: "https://example.com/gmail-icon.png" })
  imageUrl: string;

  @ApiProperty({ example: "1.0.0" })
  version: string;

  @ApiProperty({ example: ["send_email", "read_email"] })
  supportedActions: string[];

  @ApiProperty({ example: ["oauth2"] })
  credentialTypes: string[];

  @ApiProperty({ type: [ActionResponseDto] })
  actions: ActionResponseDto[];
}
