import {
  Controller,
  Get,
  Param,
  UseGuards,
  HttpException,
  HttpStatus,
  UseInterceptors,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { CacheInterceptor, CacheKey, CacheTTL } from "@nestjs/cache-manager";
import { ServicesService } from "../../services/services/services.service";
import { ActionRegistryService } from "../../services/registries/action-registry.service";
import { ServiceProvider } from "../../common/types/enums";
import { AuthGuard } from "../guards/auth.guard";
import {
  ServiceResponseDto,
  ActionResponseDto,
} from "../dtos/service-response.dto";

@ApiTags("Services")
@ApiBearerAuth()
@Controller("api/services")
@UseGuards(AuthGuard)
export class ServicesController {
  constructor(
    private readonly servicesService: ServicesService,
    private readonly actionRegistry: ActionRegistryService,
  ) {}

  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheKey("api/services")
  @CacheTTL(60)
  @ApiOperation({ summary: "Get all available services" })
  @ApiResponse({
    status: 200,
    description: "List of all services with their actions",
    type: [ServiceResponseDto],
    example: [
      {
        id: 1,
        provider: "gmail",
        name: "Gmail",
        description: "Send and receive emails using Gmail",
        imageUrl: "https://example.com/gmail-icon.png",
        version: "1.0.0",
        supportedActions: ["send_email", "read_email"],
        credentialTypes: ["oauth2"],
        actions: [
          {
            id: "gmail_send_email",
            name: "Send Email",
            description: "Sends an email using Gmail",
            type: "send_email",
            inputSchema: {
              type: "object",
              properties: {
                to: { type: "string" },
                subject: { type: "string" },
                body: { type: "string" },
              },
            },
            outputSchema: {
              type: "object",
              properties: {
                messageId: { type: "string" },
              },
            },
          },
        ],
      },
    ],
  })
  async getAllServices() {
    const services = await this.servicesService.getAllServices();
    return services.map((service) => {
      const actions = this.actionRegistry.getByProvider(
        service.provider as string,
      );

      return {
        id: service.id,
        provider: service.provider,
        name: service.name,
        description: service.description,
        imageUrl: service.imageUrl,
        version: service.version,
        supportedActions: service.supportedActions,
        credentialTypes: service.credentialTypes,
        actions: actions.map((action) => ({
          id: action.id,
          name: action.name,
          description: action.description,
          type: action.id.replace(/-/g, "_"), // Convert "send-email" to "send_email"
          inputSchema: action.inputSchema,
          outputSchema: action.outputSchema,
        })),
      };
    });
  }

  @Get(":provider")
  @ApiOperation({ summary: "Get a specific service by provider" })
  @ApiParam({ name: "provider", description: "Service provider identifier" })
  @ApiResponse({
    status: 200,
    description: "Service details",
    type: ServiceResponseDto,
    example: {
      id: 1,
      provider: "gmail",
      name: "Gmail",
      description: "Send and receive emails using Gmail",
      imageUrl: "https://example.com/gmail-icon.png",
      version: "1.0.0",
      supportedActions: ["send_email", "read_email"],
      credentialTypes: ["oauth2"],
      actions: [
        {
          id: "gmail_send_email",
          name: "Send Email",
          description: "Sends an email using Gmail",
          type: "send_email",
          inputSchema: {
            type: "object",
            properties: {
              to: { type: "string" },
              subject: { type: "string" },
              body: { type: "string" },
            },
          },
          outputSchema: {
            type: "object",
            properties: {
              messageId: { type: "string" },
            },
          },
        },
      ],
    },
  })
  @ApiResponse({ status: 404, description: "Service not found" })
  async getService(@Param("provider") provider: string) {
    const serviceProvider = provider as ServiceProvider;
    const service = await this.servicesService.getService(serviceProvider);

    if (!service) {
      throw new HttpException(
        `Service ${provider} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    const actions = this.actionRegistry.getByProvider(serviceProvider);

    return {
      id: service.id,
      provider: service.provider,
      name: service.name,
      description: service.description,
      imageUrl: service.imageUrl,
      version: service.version,
      supportedActions: service.supportedActions,
      credentialTypes: service.credentialTypes,
      actions: actions.map((action) => ({
        id: action.id,
        name: action.name,
        description: action.description,
        type: action.id.replace(/-/g, "_"), // Convert "send-email" to "send_email"
        inputSchema: action.inputSchema,
        outputSchema: action.outputSchema,
      })),
    };
  }

  @Get(":provider/actions")
  @ApiOperation({ summary: "Get all actions for a service" })
  @ApiParam({ name: "provider", description: "Service provider identifier" })
  @ApiResponse({
    status: 200,
    description: "List of actions",
    type: [ActionResponseDto],
    example: [
      {
        id: "gmail_send_email",
        name: "Send Email",
        description: "Sends an email using Gmail",
        type: "send_email",
        inputSchema: {
          type: "object",
          properties: {
            to: { type: "string" },
            subject: { type: "string" },
            body: { type: "string" },
          },
        },
        outputSchema: {
          type: "object",
          properties: {
            messageId: { type: "string" },
          },
        },
      },
    ],
  })
  @ApiResponse({ status: 404, description: "Service not found" })
  async getServiceActions(@Param("provider") provider: string) {
    const serviceProvider = provider as ServiceProvider;
    const actions = this.actionRegistry.getByProvider(serviceProvider);

    if (actions.length === 0) {
      // Check if service exists in database
      const service = await this.servicesService.getService(serviceProvider);
      if (!service) {
        throw new HttpException(
          `Service ${provider} not found`,
          HttpStatus.NOT_FOUND,
        );
      }
    }

    return actions.map((action) => ({
      id: action.id,
      name: action.name,
      description: action.description,
      type: action.id.replace(/-/g, "_"), // Convert "send-email" to "send_email"
      inputSchema: action.inputSchema,
      outputSchema: action.outputSchema,
    }));
  }

  @Get(":provider/actions/:actionId")
  @ApiOperation({ summary: "Get a specific action by ID" })
  @ApiParam({ name: "provider", description: "Service provider identifier" })
  @ApiParam({ name: "actionId", description: "Action identifier" })
  @ApiResponse({
    status: 200,
    description: "Action details",
    type: ActionResponseDto,
    example: {
      id: "gmail_send_email",
      name: "Send Email",
      description: "Sends an email using Gmail",
      type: "send_email",
      inputSchema: {
        type: "object",
        properties: {
          to: { type: "string" },
          subject: { type: "string" },
          body: { type: "string" },
        },
      },
      outputSchema: {
        type: "object",
        properties: {
          messageId: { type: "string" },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: "Action or service not found" })
  getAction(
    @Param("provider") provider: string,
    @Param("actionId") actionId: string,
  ) {
    const serviceProvider = provider as ServiceProvider;
    const action = this.actionRegistry.get(serviceProvider, actionId);

    if (!action) {
      throw new HttpException(
        `Action ${actionId} not found for service ${provider}`,
        HttpStatus.NOT_FOUND,
      );
    }

    return {
      id: action.id,
      name: action.name,
      description: action.description,
      type: action.id.replace(/-/g, "_"), // Convert "send-email" to "send_email"
      inputSchema: action.inputSchema,
      outputSchema: action.outputSchema,
    };
  }
}
