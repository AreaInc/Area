import {
  IServiceConfig,
  IAction,
  ICredentials,
  ActionParams,
  ActionResult,
} from "../types/interfaces";
import { ServiceProvider, ActionType, ExecutionStatus } from "../types/enums";

export abstract class BaseService {
  protected config: IServiceConfig;
  protected credentials: Map<string, ICredentials> = new Map();

  constructor(config: IServiceConfig) {
    this.config = config;
  }

  getProvider(): ServiceProvider {
    return this.config.metadata.provider;
  }

  getName(): string {
    return this.config.metadata.name;
  }

  getImageUrl(): string | undefined {
    return this.config.metadata.imageUrl;
  }

  getDescription(): string {
    return this.config.metadata.description;
  }

  getActions(): IAction[] {
    return this.config.actions;
  }

  getAction(actionId: string): IAction | undefined {
    return this.config.actions.find((action) => action.id === actionId);
  }

  getActionsByType(type: ActionType): IAction[] {
    return this.config.actions.filter((action) => action.type === type);
  }

  getSupportedActionTypes(): ActionType[] {
    return this.config.metadata.supportedActions;
  }

  registerCredentials(credentials: ICredentials): void {
    const key = credentials.id || `${credentials.userId}_${credentials.name}`;
    this.credentials.set(key, credentials);
  }

  getCredentials(credentialsId: string): ICredentials | undefined {
    return this.credentials.get(credentialsId);
  }

  getAllCredentials(): ICredentials[] {
    return Array.from(this.credentials.values());
  }

  removeCredentials(credentialsId: string): boolean {
    return this.credentials.delete(credentialsId);
  }

  async executeAction(
    actionId: string,
    params: ActionParams,
    credentialsId?: string,
  ): Promise<ActionResult> {
    const action = this.getAction(actionId);
    if (!action) {
      return {
        success: false,
        error: `Action ${actionId} not found`,
        status: ExecutionStatus.FAILED,
      };
    }

    let credentials: ICredentials | undefined;
    if (credentialsId) {
      credentials = this.getCredentials(credentialsId);
    } else {
      credentials = this.config.defaultCredentials;
    }

    if (!credentials) {
      return {
        success: false,
        error: "No credentials provided or found",
        status: ExecutionStatus.FAILED,
      };
    }

    const isValid = await credentials.isValid();
    if (!isValid) {
      if (credentials.refresh) {
        await credentials.refresh();
        const stillInvalid = !(await credentials.isValid());
        if (stillInvalid) {
          return {
            success: false,
            error: "Credentials are invalid and could not be refreshed",
            status: ExecutionStatus.FAILED,
          };
        }
      } else {
        return {
          success: false,
          error: "Credentials are invalid",
          status: ExecutionStatus.FAILED,
        };
      }
    }

    const validationError = this.validateInput(action.inputSchema, params);
    if (validationError) {
      return {
        success: false,
        error: `Invalid input parameters: ${validationError}`,
        status: ExecutionStatus.FAILED,
      };
    }

    try {
      const result = await action.execute(params, credentials);
      return result;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        status: ExecutionStatus.FAILED,
      };
    }
  }

  protected validateInput(
    schema: Record<string, any>,
    params: ActionParams,
  ): string | null {
    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in params)) {
          return `Missing required field: ${field}`;
        }
      }
    }

    if (schema.properties) {
      const properties = schema.properties as Record<string, { type?: string }>;
      for (const [field, fieldSchema] of Object.entries(properties)) {
        if (field in params) {
          const value: unknown = params[field] as unknown;
          const expectedType = fieldSchema?.type;

          if (expectedType === "string" && typeof value !== "string") {
            return `Field ${field} must be a string`;
          }
          if (expectedType === "number" && typeof value !== "number") {
            return `Field ${field} must be a number`;
          }
          if (expectedType === "boolean" && typeof value !== "boolean") {
            return `Field ${field} must be a boolean`;
          }
          if (expectedType === "array" && !Array.isArray(value)) {
            return `Field ${field} must be an array`;
          }
          if (
            (expectedType === "object" && typeof value !== "object") ||
            Array.isArray(value)
          ) {
            return `Field ${field} must be an object`;
          }
        }
      }
    }

    return null;
  }

  getMetadata() {
    return this.config.metadata;
  }

  protected createSuccessResult(data?: unknown): ActionResult {
    return {
      success: true,
      data,
      status: ExecutionStatus.SUCCESS,
    };
  }

  protected createErrorResult(error: string): ActionResult {
    return {
      success: false,
      error,
      status: ExecutionStatus.FAILED,
    };
  }
}
