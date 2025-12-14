import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpException,
  HttpStatus,
  ParseIntPipe,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { CredentialsService } from "../../services/credentials-service";
import { ServiceRegistry } from "../../services/service-registry";
import { ServiceProvider } from "../../common/types/enums";
import { CreateCredentialsDto } from "../dto/create-credentials.dto";
import { AuthGuard } from "../guards/auth.guard";
import { CurrentUser } from "../decorators/user.decorator";
import { GmailCredentials } from "../../services/gmail";

@ApiTags("Credentials")
@ApiBearerAuth()
@Controller("api/credentials")
@UseGuards(AuthGuard)
export class CredentialsController {
  constructor(
    private readonly credentialsService: CredentialsService,
    private readonly serviceRegistry: ServiceRegistry,
  ) {}

  @Get()
  @ApiOperation({ summary: "Get all credentials for the current user" })
  @ApiResponse({ status: 200, description: "List of user credentials" })
  async getUserCredentials(@CurrentUser() user: any) {
    const credentials = await this.credentialsService.getUserCredentials(
      user.id,
    );

    return credentials.map((cred) => ({
      id: cred.id,
      serviceProvider: cred.serviceProvider,
      type: cred.type,
      name: cred.name,
      isValid: true,
    }));
  }

  @Get(":serviceProvider")
  @ApiOperation({ summary: "Get credentials for a specific service" })
  @ApiParam({ name: "serviceProvider", description: "Service provider identifier" })
  @ApiResponse({ status: 200, description: "List of credentials for the service" })
  async getServiceCredentials(
    @CurrentUser() user: any,
    @Param("serviceProvider") serviceProvider: string,
  ) {
    const provider = serviceProvider as ServiceProvider;
    const credentials =
      await this.credentialsService.getUserServiceCredentials(user.id, provider);

    return credentials.map((cred) => ({
      id: cred.id,
      serviceProvider: cred.serviceProvider,
      type: cred.type,
      name: cred.name,
      isValid: true,
    }));
  }

  @Post()
  @ApiOperation({ summary: "Create new credentials for a service" })
  @ApiBody({ type: CreateCredentialsDto })
  @ApiResponse({ status: 201, description: "Credentials created successfully" })
  @ApiResponse({ status: 400, description: "Invalid request" })
  @ApiResponse({ status: 404, description: "Service not found" })
  async createCredentials(
    @CurrentUser() user: any,
    @Body() createDto: CreateCredentialsDto,
  ) {
    const provider = createDto.serviceProvider as ServiceProvider;
    const serviceInstance = this.serviceRegistry.get(provider);

    if (!serviceInstance) {
      throw new HttpException(
        `Service ${createDto.serviceProvider} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    let credentials;
    switch (provider) {
      case ServiceProvider.GMAIL:
        credentials = new GmailCredentials(
          user.id,
          createDto.name,
          createDto.data as any,
        );
        break;
      default:
        throw new HttpException(
          `Unsupported service provider: ${provider}`,
          HttpStatus.BAD_REQUEST,
        );
    }

    const saved = await this.credentialsService.saveCredentials(credentials);

    return {
      id: saved.id,
      serviceProvider: saved.serviceProvider,
      type: saved.type,
      name: saved.name,
      isValid: saved.isValid,
    };
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete credentials by ID" })
  @ApiParam({ name: "id", description: "Credentials ID" })
  @ApiResponse({ status: 200, description: "Credentials deleted successfully" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "Credentials not found" })
  async deleteCredentials(
    @CurrentUser() user: any,
    @Param("id", ParseIntPipe) id: number,
  ) {
    const credential = await this.credentialsService.getCredentialsById(id);

    if (!credential) {
      throw new HttpException("Credentials not found", HttpStatus.NOT_FOUND);
    }

    if (credential.userId !== user.id) {
      throw new HttpException("Forbidden", HttpStatus.FORBIDDEN);
    }

    const deleted = await this.credentialsService.deleteCredentials(id);

    if (!deleted) {
      throw new HttpException(
        "Failed to delete credentials",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return { success: true };
  }
}

