import { Injectable } from "@nestjs/common";
import {
  IAction,
  ActionMetadata,
} from "../../../common/types/action.interface";
import { ActionType } from "../../../common/types/enums";

@Injectable()
export class StarRepositoryAction implements IAction {
  public readonly id = "star_repository";
  public readonly name = "Star Repository";
  public readonly description = "Stars a GitHub repository";
  public readonly type = ActionType.UPDATE_DOCUMENT;
  public readonly serviceProvider = "github";
  public readonly requiresCredentials = true;

  public readonly inputSchema = {
    type: "object",
    required: ["owner", "repo"],
    properties: {
      owner: {
        type: "string",
        description: "Repository owner (username or organization)",
      },
      repo: {
        type: "string",
        description: "Repository name",
      },
    },
  };

  public readonly outputSchema = {
    type: "object",
    properties: {
      success: {
        type: "boolean",
        description: "Whether the repository was successfully starred",
      },
      message: {
        type: "string",
        description: "Success message",
      },
    },
  };

  async validateInput(config: Record<string, any>): Promise<boolean> {
    if (!config.owner || typeof config.owner !== "string") {
      throw new Error('Invalid "owner": must be a non-empty string');
    }
    if (!config.repo || typeof config.repo !== "string") {
      throw new Error('Invalid "repo": must be a non-empty string');
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
