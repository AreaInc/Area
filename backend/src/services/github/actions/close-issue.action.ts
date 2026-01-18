import { Injectable } from "@nestjs/common";
import {
  IAction,
  ActionMetadata,
} from "../../../common/types/action.interface";
import { ActionType } from "../../../common/types/enums";

@Injectable()
export class CloseIssueAction implements IAction {
  public readonly id = "close_issue";
  public readonly name = "Close Issue";
  public readonly description = "Closes a GitHub issue";
  public readonly type = ActionType.UPDATE_DOCUMENT;
  public readonly serviceProvider = "github";
  public readonly requiresCredentials = true;

  public readonly inputSchema = {
    type: "object",
    required: ["owner", "repo", "issueNumber"],
    properties: {
      owner: {
        type: "string",
        description: "Repository owner (username or organization)",
      },
      repo: {
        type: "string",
        description: "Repository name",
      },
      issueNumber: {
        type: "number",
        description: "Issue number to close",
      },
    },
  };

  public readonly outputSchema = {
    type: "object",
    properties: {
      number: {
        type: "number",
        description: "Issue number",
      },
      state: {
        type: "string",
        description: "Issue state (should be 'closed')",
      },
      url: {
        type: "string",
        description: "URL to the closed issue",
      },
      success: {
        type: "boolean",
        description: "Whether the issue was successfully closed",
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
    if (
      !config.issueNumber ||
      typeof config.issueNumber !== "number" ||
      config.issueNumber <= 0
    ) {
      throw new Error('Invalid "issueNumber": must be a positive number');
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
