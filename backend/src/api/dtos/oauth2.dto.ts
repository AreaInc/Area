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

export class CreateCredentialDto {
  @ApiProperty({
    description: "Credential name",
    example: "My Gmail Account",
  })
  name: string;

  @ApiProperty({
    description: "Service provider",
    example: "gmail",
  })
  provider: string;

  @ApiPropertyOptional({
    description: "OAuth2 Client ID from provider",
    example: "123456789-abcdef.apps.googleusercontent.com",
  })
  clientId?: string;

  @ApiPropertyOptional({
    description: "OAuth2 Client Secret from provider",
    example: "GOCSPX-abc123def456",
  })
  clientSecret?: string;
}

export class CredentialResponseDto {
  @ApiProperty({
    description: "Credential ID",
    example: 123,
  })
  id: number;

  @ApiProperty({
    description: "Credential name",
    example: "My Gmail Account",
  })
  name: string;

  @ApiProperty({
    description: "Service provider",
    example: "gmail",
  })
  serviceProvider: string;

  @ApiProperty({
    description: "Credential type",
    example: "oauth2",
  })
  credentialType: string;

  @ApiProperty({
    description: "Whether credentials are valid/connected",
    example: true,
  })
  isValid: boolean;

  @ApiProperty({
    description: "Creation timestamp",
  })
  createdAt: Date;

  @ApiProperty({
    description: "Last update timestamp",
  })
  updatedAt: Date;
}
