import {
  Controller,
  Get,
  Param,
  UseGuards,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { ServiceRegistry } from "../../services/service-registry";
import { ServicesService } from "../../services/services-service";
import { ServiceProvider } from "../../common/types/enums";
import { AuthGuard } from "../guards/auth.guard";

@ApiTags("Services")
@ApiBearerAuth()
@Controller("api/services")
@UseGuards(AuthGuard)
export class ServicesController {
  constructor(
    private readonly serviceRegistry: ServiceRegistry,
    private readonly servicesService: ServicesService,
  ) {}

  @Get()
  @ApiOperation({ summary: "Get all available services" })
  @ApiResponse({
    status: 200,
    description: "List of all services with their actions",
  })
  async getAllServices() {
    const services = await this.servicesService.getAllServices();
    const servicesWithActions = await Promise.all(
      services.map(async (service) => {
        const serviceInstance = this.serviceRegistry.get(
          service.provider as ServiceProvider,
        );
        const actions = serviceInstance?.getActions() || [];

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
            type: action.type,
            inputSchema: action.inputSchema,
            outputSchema: action.outputSchema,
          })),
        };
      }),
    );

    return servicesWithActions;
  }

  @Get(":provider")
  @ApiOperation({ summary: "Get a specific service by provider" })
  @ApiParam({ name: "provider", description: "Service provider identifier" })
  @ApiResponse({ status: 200, description: "Service details" })
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

    const serviceInstance = this.serviceRegistry.get(serviceProvider);
    if (!serviceInstance) {
      throw new HttpException(
        `Service ${provider} not registered`,
        HttpStatus.NOT_FOUND,
      );
    }

    const actions = serviceInstance.getActions();

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
        type: action.type,
        inputSchema: action.inputSchema,
        outputSchema: action.outputSchema,
      })),
    };
  }

  @Get(":provider/actions")
  @ApiOperation({ summary: "Get all actions for a service" })
  @ApiParam({ name: "provider", description: "Service provider identifier" })
  @ApiResponse({ status: 200, description: "List of actions" })
  @ApiResponse({ status: 404, description: "Service not found" })
  async getServiceActions(@Param("provider") provider: string) {
    const serviceProvider = provider as ServiceProvider;
    const serviceInstance = this.serviceRegistry.get(serviceProvider);

    if (!serviceInstance) {
      throw new HttpException(
        `Service ${provider} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    const actions = serviceInstance.getActions();

    return actions.map((action) => ({
      id: action.id,
      name: action.name,
      description: action.description,
      type: action.type,
      inputSchema: action.inputSchema,
      outputSchema: action.outputSchema,
    }));
  }

  @Get(":provider/actions/:actionId")
  @ApiOperation({ summary: "Get a specific action by ID" })
  @ApiParam({ name: "provider", description: "Service provider identifier" })
  @ApiParam({ name: "actionId", description: "Action identifier" })
  @ApiResponse({ status: 200, description: "Action details" })
  @ApiResponse({ status: 404, description: "Action or service not found" })
  async getAction(
    @Param("provider") provider: string,
    @Param("actionId") actionId: string,
  ) {
    const serviceProvider = provider as ServiceProvider;
    const serviceInstance = this.serviceRegistry.get(serviceProvider);

    if (!serviceInstance) {
      throw new HttpException(
        `Service ${provider} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    const action = serviceInstance.getAction(actionId);

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
      type: action.type,
      inputSchema: action.inputSchema,
      outputSchema: action.outputSchema,
    };
  }
}

