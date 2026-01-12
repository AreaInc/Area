import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class OAuth2CallbackResponseDto {
  @ApiProperty({
    description: "Success status",
    example: true,
  })
  success: boolean;

  @ApiPropertyOptional({
    description: "Credential ID if successful",
    example: 123,
  })
  credentialId?: number;

  @ApiPropertyOptional({
    description: "Error message if failed",
    example: "Invalid state token",
  })
  error?: string;
}

export class DeleteCredentialsResponseDto {
  @ApiProperty({
    description: "Success status",
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: "Success message",
    example: "Credentials deleted successfully",
  })
  message: string;
}
