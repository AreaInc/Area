import { Injectable } from "@nestjs/common";
import {
  IAction,
  ActionMetadata,
} from "../../../common/types/action.interface";
import { ActionType } from "../../../common/types/enums";

@Injectable()
export class CreateRepositoryAction implements IAction {
  public readonly id = "create_repository";
  public readonly name = "Create Repository";
  public readonly description = "Creates a new GitHub repository";
  public readonly type = ActionType.CREATE_DOCUMENT;
  public readonly serviceProvider = "github";
  public readonly requiresCredentials = true;

  public readonly inputSchema = {
    type: "object",
    required: ["name"],
    properties: {
      name: {
        type: "string",
        description: "Repository name",
      },
      description: {
        type: "string",
        description: "Repository description",
      },
      private: {
        type: "boolean",
        description: "Whether the repository should be private",
      },
      autoInit: {
        type: "boolean",
        description: "Initialize repository with a README",
      },
    },
  };

  public readonly outputSchema = {
    type: "object",
    properties: {
      id: {
        type: "number",
        description: "Repository ID",
      },
      name: {
        type: "string",
        description: "Repository name",
      },
      fullName: {
        type: "string",
        description: "Full repository name (owner/repo)",
      },
      url: {
        type: "string",
        description: "Repository URL",
      },
      private: {
        type: "boolean",
        description: "Whether the repository is private",
      },
    },
  };

  async validateInput(config: Record<string, any>): Promise<boolean> {
    if (!config.name || typeof config.name !== "string") {
      throw new Error('Invalid "name": must be a non-empty string');
    }
    if (
      config.description !== undefined &&
      typeof config.description !== "string"
    ) {
      throw new Error('Invalid "description": must be a string');
    }
    if (config.private !== undefined && typeof config.private !== "boolean") {
      throw new Error('Invalid "private": must be a boolean');
    }
    if (config.autoInit !== undefined && typeof config.autoInit !== "boolean") {
      throw new Error('Invalid "autoInit": must be a boolean');
    }
    return true;
  }

  getMetadata(): ActionMetadata {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      serviceProvider: this.serviceProvider,
      inputSchema: this.inputSchema,
      outputSchema: this.outputSchema,
      requiresCredentials: this.requiresCredentials,
    };
  }
}
