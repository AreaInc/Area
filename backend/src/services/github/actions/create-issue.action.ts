import { Injectable } from "@nestjs/common";
import {
  IAction,
  ActionMetadata,
} from "../../../common/types/action.interface";
import { ActionType } from "../../../common/types/enums";

@Injectable()
export class CreateIssueAction implements IAction {
  public readonly id = "create_issue";
  public readonly name = "Create Issue";
  public readonly description = "Creates a new issue in a GitHub repository";
  public readonly type = ActionType.CREATE_ISSUE;
  public readonly serviceProvider = "github";
  public readonly requiresCredentials = true;

  public readonly inputSchema = {
    type: "object",
    required: ["owner", "repo", "title"],
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
        description: "Issue title",
      },
      body: {
        type: "string",
        description: "Issue body/description",
      },
      labels: {
        type: "array",
        items: { type: "string" },
        description: "Labels to add to the issue",
      },
      assignees: {
        type: "array",
        items: { type: "string" },
        description: "Usernames to assign to the issue",
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
      id: {
        type: "number",
        description: "Issue ID",
      },
      title: {
        type: "string",
        description: "Issue title",
      },
      url: {
        type: "string",
        description: "URL to the created issue",
      },
      state: {
        type: "string",
        description: "Issue state (open/closed)",
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
    if (config.body !== undefined && typeof config.body !== "string") {
      throw new Error('Invalid "body": must be a string');
    }
    if (
      config.labels !== undefined &&
      (!Array.isArray(config.labels) ||
        !config.labels.every((l) => typeof l === "string"))
    ) {
      throw new Error('Invalid "labels": must be an array of strings');
    }
    if (
      config.assignees !== undefined &&
      (!Array.isArray(config.assignees) ||
        !config.assignees.every((a) => typeof a === "string"))
    ) {
      throw new Error('Invalid "assignees": must be an array of strings');
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
