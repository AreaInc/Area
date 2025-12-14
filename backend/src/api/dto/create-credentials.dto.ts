import { ApiProperty } from "@nestjs/swagger";

export class CreateCredentialsDto {
  @ApiProperty({
    description: "Service provider identifier (e.g., 'gmail', 'slack')",
    example: "gmail",
  })
  serviceProvider: string;

  @ApiProperty({
    description: "Name for the credentials",
    example: "My Gmail Account",
  })
  name: string;

  @ApiProperty({
    description: "Credential data (encrypted before storage)",
    example: { accessToken: "xxx", refreshToken: "yyy" },
  })
  data: Record<string, any>;
}

