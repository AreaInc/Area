import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  UseGuards,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { ServiceRegistry } from "../../services/service-registry";
import { CredentialsService } from "../../services/credentials-service";
import { ActionsService } from "../../services/actions-service";
import { ServiceProvider, ExecutionStatus } from "../../common/types/enums";
import { ExecuteActionDto } from "../dto/execute-action.dto";
import { AuthGuard } from "../guards/auth.guard";
import { CurrentUser } from "../decorators/user.decorator";
import type { AuthUser } from "../types/user";
import { BaseCredentials } from "../../common/base/base-credentials";
import {
  ActionExecutionResponseDto,
  ActionExecutionHistoryDto,
} from "../dto/action-response.dto";

@ApiTags("Actions")
@ApiBearerAuth()
@Controller("api/actions")
@UseGuards(AuthGuard)
export class ActionsController {
  constructor(
    private readonly serviceRegistry: ServiceRegistry,
    private readonly credentialsService: CredentialsService,
    private readonly actionsService: ActionsService,
  ) {}

  @Post(":provider/:actionId/execute")
  @ApiOperation({ summary: "Execute an action for a service" })
  @ApiParam({ name: "provider", description: "Service provider identifier" })
  @ApiParam({ name: "actionId", description: "Action identifier" })
  @ApiBody({ type: ExecuteActionDto })
  @ApiResponse({
    status: 200,
    description: "Action executed successfully",
    type: ActionExecutionResponseDto,
    example: {
      executionId: 123,
      success: true,
      data: {
        messageId: "xxx",
        threadId: "yyy",
      },
      status: "success",
    },
  })
  @ApiResponse({
    status: 400,
    description: "Invalid request or missing credentials",
  })
  @ApiResponse({
    status: 404,
    description: "Service, action, or credentials not found",
  })
  async executeAction(
    @CurrentUser() user: AuthUser,
    @Param("provider") provider: string,
    @Param("actionId") actionId: string,
    @Body() executeDto: ExecuteActionDto,
  ) {
    const serviceProvider = provider as ServiceProvider;
    const serviceInstance = this.serviceRegistry.get(serviceProvider);

    if (!serviceInstance) {
      throw new HttpException(
        `Service ${provider} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    let credentials: BaseCredentials;
    if (executeDto.credentialsId) {
      const cred = await this.credentialsService.getCredentialsById(
        executeDto.credentialsId,
      );

      if (!cred) {
        throw new HttpException("Credentials not found", HttpStatus.NOT_FOUND);
      }

      if (cred.userId !== String(user.id)) {
        throw new HttpException("Forbidden", HttpStatus.FORBIDDEN);
      }

      credentials = cred;
    } else {
      const userCredentials =
        await this.credentialsService.getUserServiceCredentials(
          String(user.id),
          serviceProvider,
        );

      if (userCredentials.length === 0) {
        throw new HttpException(
          "No credentials found for this service",
          HttpStatus.BAD_REQUEST,
        );
      }

      credentials = userCredentials[0];
    }

    const credId: string | undefined = credentials.id;
    const credentialsIdStr: string | undefined =
      typeof credId === "string" ? credId : undefined;
    const credentialsId = credentialsIdStr
      ? parseInt(credentialsIdStr, 10)
      : null;
    const execution = await this.actionsService.logExecution(
      String(user.id),
      serviceProvider,
      actionId,
      credentialsId,
      ExecutionStatus.RUNNING,
      executeDto.params as Record<string, unknown>,
    );

    try {
      const result = await serviceInstance.executeAction(
        actionId,
        executeDto.params,
        credentialsIdStr,
      );

      await this.actionsService.updateExecutionStatus(
        execution.id,
        result.status,
        result.data as Record<string, unknown> | undefined,
        result.error,
      );

      return {
        executionId: execution.id,
        ...result,
      };
    } catch (error) {
      await this.actionsService.updateExecutionStatus(
        execution.id,
        ExecutionStatus.FAILED,
        undefined,
        error instanceof Error ? error.message : "Unknown error",
      );

      throw new HttpException(
        error instanceof Error ? error.message : "Action execution failed",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get("executions")
  @ApiOperation({ summary: "Get execution history for the current user" })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Maximum number of executions to return",
  })
  @ApiResponse({
    status: 200,
    description: "List of executions",
    type: [ActionExecutionHistoryDto],
    example: [
      {
        id: 123,
        serviceProvider: "gmail",
        actionId: "gmail_send_email",
        status: "success",
        inputParams: {
          to: "user@example.com",
          subject: "Hello",
          body: "World",
        },
        outputData: {
          messageId: "xxx",
          threadId: "yyy",
        },
        errorMessage: null,
        startedAt: "2024-01-01T00:00:00Z",
        completedAt: "2024-01-01T00:00:01Z",
        createdAt: "2024-01-01T00:00:00Z",
      },
    ],
  })
  async getExecutions(
    @CurrentUser() user: AuthUser,
    @Query("limit") limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    const executions = await this.actionsService.getUserExecutions(
      String(user.id),
      limitNum,
    );

    return executions.map((exec) => ({
      id: exec.id,
      serviceProvider: exec.serviceProvider,
      actionId: exec.actionId,
      status: exec.status,
      inputParams: exec.inputParams,
      outputData: exec.outputData,
      errorMessage: exec.errorMessage,
      startedAt: exec.startedAt,
      completedAt: exec.completedAt,
      createdAt: exec.createdAt,
    }));
  }
}
