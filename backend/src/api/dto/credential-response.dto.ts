import { ApiProperty } from "@nestjs/swagger";

export class CredentialResponseDto {
  @ApiProperty({
    description: "Credential ID",
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: "Service provider identifier",
    example: "gmail",
  })
  serviceProvider: string;

  @ApiProperty({
    description: "Credential type",
    example: "oauth2",
  })
  type: string;

  @ApiProperty({
    description: "Credential name",
    example: "My Gmail Account",
  })
  name: string;

  @ApiProperty({
    description: "Whether the credential is valid",
    example: true,
  })
  isValid: boolean;
}

export class SuccessResponseDto {
  @ApiProperty({
    description: "Success indicator",
    example: true,
  })
  success: boolean;
}
