import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class EmailAttachmentDto {
  @ApiProperty({ description: "Attachment filename", example: "document.pdf" })
  filename: string;

  @ApiProperty({ description: "MIME type", example: "application/pdf" })
  mimeType: string;

  @ApiProperty({ description: "File size in bytes", example: 1024 })
  size: number;

  @ApiProperty({ description: "Gmail attachment ID", example: "attachment123" })
  attachmentId: string;
}

export class GmailWebhookPayloadDto {
  @ApiProperty({ description: "Gmail message ID", example: "1234567890" })
  messageId: string;

  @ApiPropertyOptional({ description: "Gmail thread ID", example: "thread123" })
  threadId?: string;

  @ApiProperty({
    description: "Sender email address",
    example: "sender@example.com",
  })
  from: string;

  @ApiProperty({
    description: "Recipient email address",
    example: "recipient@example.com",
  })
  to: string;

  @ApiProperty({ description: "Email subject", example: "Test Email" })
  subject: string;

  @ApiPropertyOptional({ description: "Plain text body" })
  body?: string;

  @ApiPropertyOptional({ description: "HTML body" })
  htmlBody?: string;

  @ApiPropertyOptional({
    description: "Email date",
    example: "2024-01-01T00:00:00Z",
  })
  date?: string;

  @ApiPropertyOptional({
    description: "Email attachments",
    type: [EmailAttachmentDto],
  })
  attachments?: EmailAttachmentDto[];
}

export class GmailWebhookResponseDto {
  @ApiProperty({ description: "Success status", example: true })
  success: boolean;

  @ApiProperty({
    description: "Number of workflows triggered successfully",
    example: 2,
  })
  triggered: number;

  @ApiProperty({ description: "Number of workflows that failed", example: 0 })
  failed: number;

  @ApiProperty({
    description: "Total number of matching workflows",
    example: 2,
  })
  totalWorkflows: number;
}

export class TestWebhookPayloadDto {
  @ApiPropertyOptional({
    description: "Test sender email",
    example: "test@example.com",
  })
  from?: string;

  @ApiPropertyOptional({
    description: "Test recipient email",
    example: "user@example.com",
  })
  to?: string;

  @ApiPropertyOptional({ description: "Test subject", example: "Test Email" })
  subject?: string;

  @ApiPropertyOptional({
    description: "Test body",
    example: "This is a test email",
  })
  body?: string;
}
