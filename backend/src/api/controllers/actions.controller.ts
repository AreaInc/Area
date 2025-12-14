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
  ParseIntPipe,
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
  @ApiResponse({ status: 200, description: "Action executed successfully" })
  @ApiResponse({ status: 400, description: "Invalid request or missing credentials" })
  @ApiResponse({ status: 404, description: "Service, action, or credentials not found" })
  async executeAction(
    @CurrentUser() user: any,
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

    let credentials;
    if (executeDto.credentialsId) {
      const cred = await this.credentialsService.getCredentialsById(
        executeDto.credentialsId,
      );

      if (!cred) {
        throw new HttpException(
          "Credentials not found",
          HttpStatus.NOT_FOUND,
        );
      }

      if (cred.userId !== user.id) {
        throw new HttpException("Forbidden", HttpStatus.FORBIDDEN);
      }

      credentials = cred;
    } else {
      const userCredentials =
        await this.credentialsService.getUserServiceCredentials(
          user.id,
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

    const execution = await this.actionsService.logExecution(
      user.id,
      serviceProvider,
      actionId,
      credentials.id ? parseInt(credentials.id) : null,
      ExecutionStatus.RUNNING,
      executeDto.params,
    );

    try {
      const result = await serviceInstance.executeAction(
        actionId,
        executeDto.params,
        credentials.id,
      );

      await this.actionsService.updateExecutionStatus(
        execution.id,
        result.status,
        result.data,
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
  @ApiQuery({ name: "limit", required: false, type: Number, description: "Maximum number of executions to return" })
  @ApiResponse({ status: 200, description: "List of executions" })
  async getExecutions(
    @CurrentUser() user: any,
    @Query("limit") limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    const executions = await this.actionsService.getUserExecutions(
      user.id,
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

