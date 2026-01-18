import { Injectable } from "@nestjs/common";
import {
  IAction,
  ActionMetadata,
} from "../../../common/types/action.interface";
import { ActionType } from "../../../common/types/enums";

@Injectable()
export class MergePullRequestAction implements IAction {
  public readonly id = "merge_pull_request";
  public readonly name = "Merge Pull Request";
  public readonly description = "Merges a pull request in a GitHub repository";
  public readonly type = ActionType.UPDATE_DOCUMENT;
  public readonly serviceProvider = "github";
  public readonly requiresCredentials = true;

  public readonly inputSchema = {
    type: "object",
    required: ["owner", "repo", "pullNumber"],
    properties: {
      owner: {
        type: "string",
        description: "Repository owner (username or organization)",
      },
      repo: {
        type: "string",
        description: "Repository name",
      },
      pullNumber: {
        type: "number",
        description: "Pull request number to merge",
      },
      commitTitle: {
        type: "string",
        description: "Title for the merge commit",
      },
      commitMessage: {
        type: "string",
        description: "Message for the merge commit",
      },
      mergeMethod: {
        type: "string",
        enum: ["merge", "squash", "rebase"],
        description: "Merge method to use",
      },
    },
  };

  public readonly outputSchema = {
    type: "object",
    properties: {
      merged: {
        type: "boolean",
        description: "Whether the PR was successfully merged",
      },
      message: {
        type: "string",
        description: "Merge message",
      },
      sha: {
        type: "string",
        description: "SHA of the merge commit",
      },
      success: {
        type: "boolean",
        description: "Whether the operation was successful",
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
      !config.pullNumber ||
      typeof config.pullNumber !== "number" ||
      config.pullNumber <= 0
    ) {
      throw new Error('Invalid "pullNumber": must be a positive number');
    }
    if (
      config.commitTitle !== undefined &&
      typeof config.commitTitle !== "string"
    ) {
      throw new Error('Invalid "commitTitle": must be a string');
    }
    if (
      config.commitMessage !== undefined &&
      typeof config.commitMessage !== "string"
    ) {
      throw new Error('Invalid "commitMessage": must be a string');
    }
    if (
      config.mergeMethod !== undefined &&
      !["merge", "squash", "rebase"].includes(config.mergeMethod)
    ) {
      throw new Error(
        'Invalid "mergeMethod": must be "merge", "squash", or "rebase"',
      );
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
