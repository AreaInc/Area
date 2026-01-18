import {
  Controller,
  Get,
  Param,
  UseGuards,
  NotFoundException,
} from "@nestjs/common";
import { AuthGuard } from "../guards/auth.guard";
import { ActionRegistryService } from "../../services/registries/action-registry.service";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { ActionMetadataResponseDto } from "../dtos";

@ApiTags("Actions")
@ApiBearerAuth()
@Controller("api/v2/actions")
@UseGuards(AuthGuard)
export class ActionsController {
  constructor(private readonly actionRegistry: ActionRegistryService) {}

  @Get()
  @ApiOperation({
    summary: "Get all available actions",
    description:
      "Returns metadata for all available actions across all service providers. This includes action IDs, names, descriptions, input schemas, and output schemas. Useful for building workflow creation UIs.",
  })
  @ApiResponse({
    status: 200,
    description: "List of available actions",
    type: [ActionMetadataResponseDto],
    example: [
      {
        id: "send-email",
        name: "Send Email",
        description: "Sends an email via Gmail",
        serviceProvider: "gmail",
        inputSchema: {
          type: "object",
          properties: {
            to: {
              type: "string",
              description: "Recipient email address",
            },
            subject: {
              type: "string",
              description: "Email subject",
            },
            body: {
              type: "string",
              description: "Email body content",
            },
          },
          required: ["to", "subject", "body"],
        },
        outputSchema: {
          type: "object",
          properties: {
            messageId: { type: "string" },
            success: { type: "boolean" },
          },
        },
        requiresCredentials: true,
      },
    ],
  })
  async getAllActions() {
    return this.actionRegistry.getAllMetadata();
  }

  @Get(":service")
  @ApiOperation({
    summary: "Get actions for a specific service",
    description:
      "Returns metadata for all available actions for a specific service provider (e.g., gmail, slack, spotify). Returns an empty array if the service has no actions or doesn't exist.",
  })
  @ApiParam({
    name: "service",
    description: "Service provider name (e.g., gmail, slack, spotify)",
    type: String,
    example: "gmail",
  })
  @ApiResponse({
    status: 200,
    description: "List of available actions for the specified service",
    type: [ActionMetadataResponseDto],
    example: [
      {
        id: "send-email",
        name: "Send Email",
        description: "Sends an email via Gmail",
        serviceProvider: "gmail",
        inputSchema: {
          type: "object",
          properties: {
            to: {
              type: "string",
              description: "Recipient email address",
            },
            subject: {
              type: "string",
              description: "Email subject",
            },
            body: {
              type: "string",
              description: "Email body content",
            },
          },
          required: ["to", "subject", "body"],
        },
        outputSchema: {
          type: "object",
          properties: {
            messageId: { type: "string" },
            success: { type: "boolean" },
          },
        },
        requiresCredentials: true,
      },
    ],
  })
  async getActionsByService(@Param("service") service: string) {
    const actions = this.actionRegistry.getByProvider(service);
    return actions.map((action) => action.getMetadata());
  }
}
