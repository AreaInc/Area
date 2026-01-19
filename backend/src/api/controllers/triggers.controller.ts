import {
  Controller,
  Get,
  Param,
  UseGuards,
  NotFoundException,
} from "@nestjs/common";
import { AuthGuard } from "../guards/auth.guard";
import { AllowAnonymous } from "@thallesp/nestjs-better-auth";
import { TriggerRegistryService } from "../../services/registries/trigger-registry.service";
import { ServicesService } from "../../services/services/services.service";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { TriggerMetadataResponseDto } from "../dtos";

@ApiTags("Triggers")
@ApiBearerAuth()
@Controller("api/v2/triggers")
export class TriggersController {
  constructor(
    private readonly triggerRegistry: TriggerRegistryService,
    private readonly servicesService: ServicesService,
  ) {}

  @Get()
  @AllowAnonymous()
  @ApiOperation({
    summary: "Get all available triggers",
    description:
      "Returns metadata for all available triggers across all service providers. This includes trigger IDs, names, descriptions, configuration schemas, and output schemas. Useful for building workflow creation UIs.",
  })
  @ApiResponse({
    status: 200,
    description: "List of available triggers",
    type: [TriggerMetadataResponseDto],
    example: [
      {
        id: "receive-email",
        name: "Receive Email",
        description: "Triggers when a new email is received",
        serviceProvider: "gmail",
        triggerType: "event",
        configSchema: {
          type: "object",
          properties: {
            from: {
              type: "string",
              description: "Filter emails by sender address",
            },
          },
        },
        outputSchema: {
          type: "object",
          properties: {
            messageId: { type: "string" },
            from: { type: "string" },
            subject: { type: "string" },
          },
        },
        requiresCredentials: false,
      },
    ],
  })
  async getAllTriggers() {
    const triggers = this.triggerRegistry.getAllMetadata();
    const services = await this.servicesService.getAllServices();
    const serviceMap = new Map(
      services.map((s) => [s.provider as string, s.imageUrl]),
    );

    return triggers.map((trigger) => ({
      ...trigger,
      serviceImageUrl: serviceMap.get(trigger.serviceProvider as string) || null,
    }));
  }

  @Get(":service")
  @AllowAnonymous()
  @ApiOperation({
    summary: "Get triggers for a specific service",
    description:
      "Returns metadata for all available triggers for a specific service provider (e.g., gmail, slack, spotify). Returns an empty array if the service has no triggers or doesn't exist.",
  })
  @ApiParam({
    name: "service",
    description: "Service provider name (e.g., gmail, slack, spotify)",
    type: String,
    example: "gmail",
  })
  @ApiResponse({
    status: 200,
    description: "List of available triggers for the specified service",
    type: [TriggerMetadataResponseDto],
    example: [
      {
        id: "receive-email",
        name: "Receive Email",
        description: "Triggers when a new email is received",
        serviceProvider: "gmail",
        triggerType: "event",
        configSchema: {
          type: "object",
          properties: {
            from: {
              type: "string",
              description: "Filter emails by sender address",
            },
          },
        },
        outputSchema: {
          type: "object",
          properties: {
            messageId: { type: "string" },
            from: { type: "string" },
            subject: { type: "string" },
          },
        },
        requiresCredentials: false,
      },
    ],
  })
  async getTriggersByService(@Param("service") service: string) {
    const triggers = this.triggerRegistry.getByProvider(service);
    const serviceData = await this.servicesService.getService(service);
    const serviceImageUrl = serviceData?.imageUrl || null;

    return triggers.map((trigger) => ({
      id: trigger.id,
      name: trigger.name,
      description: trigger.description,
      serviceProvider: trigger.serviceProvider,
      triggerType: trigger.triggerType,
      configSchema: trigger.configSchema,
      outputSchema: trigger.outputSchema,
      requiresCredentials: trigger.requiresCredentials,
      serviceImageUrl,
    }));
  }
}
