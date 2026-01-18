import { Injectable } from "@nestjs/common";
import {
  IAction,
  ActionMetadata,
} from "../../../common/types/action.interface";
import { ActionType } from "../../../common/types/enums";

@Injectable()
export class AddCommentAction implements IAction {
  public readonly id = "add_comment";
  public readonly name = "Add Comment";
  public readonly description =
    "Adds a comment to a GitHub issue or pull request";
  public readonly type = ActionType.UPDATE_DOCUMENT;
  public readonly serviceProvider = "github";
  public readonly requiresCredentials = true;

  public readonly inputSchema = {
    type: "object",
    required: ["owner", "repo", "issueNumber", "body"],
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
        description: "Issue or PR number",
      },
      body: {
        type: "string",
        description: "Comment body",
      },
    },
  };

  public readonly outputSchema = {
    type: "object",
    properties: {
      id: {
        type: "number",
        description: "Comment ID",
      },
      url: {
        type: "string",
        description: "URL to the comment",
      },
      body: {
        type: "string",
        description: "Comment body",
      },
      success: {
        type: "boolean",
        description: "Whether the comment was successfully added",
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
    if (!config.body || typeof config.body !== "string") {
      throw new Error('Invalid "body": must be a non-empty string');
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
