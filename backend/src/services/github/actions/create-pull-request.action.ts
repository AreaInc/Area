import { Injectable } from "@nestjs/common";
import {
  IAction,
  ActionMetadata,
} from "../../../common/types/action.interface";
import { ActionType } from "../../../common/types/enums";

@Injectable()
export class CreatePullRequestAction implements IAction {
  public readonly id = "create_pull_request";
  public readonly name = "Create Pull Request";
  public readonly description =
    "Creates a new pull request in a GitHub repository";
  public readonly type = ActionType.CREATE_DOCUMENT;
  public readonly serviceProvider = "github";
  public readonly requiresCredentials = true;

  public readonly inputSchema = {
    type: "object",
    required: ["owner", "repo", "title", "head", "base"],
    properties: {
      owner: {
        type: "string",
        description: "Repository owner (username or organization)",
      },
      repo: {
        type: "string",
        description: "Repository name",
      },
      title: {
        type: "string",
        description: "Pull request title",
      },
      head: {
        type: "string",
        description: "Branch to merge from (e.g., 'feature-branch'). For cross-repo PRs, use 'username:branch' format",
      },
      base: {
        type: "string",
        description: "Branch to merge into (e.g., 'main' or 'master'). This branch must exist in the repository",
      },
      body: {
        type: "string",
        description: "Pull request description",
      },
      draft: {
        type: "boolean",
        description: "Create as draft pull request",
      },
    },
  };

  public readonly outputSchema = {
    type: "object",
    properties: {
      number: {
        type: "number",
        description: "Pull request number",
      },
      id: {
        type: "number",
        description: "Pull request ID",
      },
      title: {
        type: "string",
        description: "Pull request title",
      },
      url: {
        type: "string",
        description: "URL to the pull request",
      },
      state: {
        type: "string",
        description: "Pull request state",
      },
      draft: {
        type: "boolean",
        description: "Whether the PR is a draft",
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
    if (!config.title || typeof config.title !== "string") {
      throw new Error('Invalid "title": must be a non-empty string');
    }
    if (!config.head || typeof config.head !== "string") {
      throw new Error('Invalid "head": must be a non-empty string');
    }
    if (!config.base || typeof config.base !== "string") {
      throw new Error('Invalid "base": must be a non-empty string');
    }
    if (config.body !== undefined && typeof config.body !== "string") {
      throw new Error('Invalid "body": must be a string');
    }
    if (config.draft !== undefined && typeof config.draft !== "boolean") {
      throw new Error('Invalid "draft": must be a boolean');
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
