import { Injectable } from "@nestjs/common";
import {
  IAction,
  ActionMetadata,
} from "../../../common/types/action.interface";
import { ActionType } from "../../../common/types/enums";

@Injectable()
export class AddLabelAction implements IAction {
  public readonly id = "add_label";
  public readonly name = "Add Label to Issue";
  public readonly description = "Adds labels to a GitHub issue";
  public readonly type = ActionType.UPDATE_DOCUMENT;
  public readonly serviceProvider = "github";
  public readonly requiresCredentials = true;

  public readonly inputSchema = {
    type: "object",
    required: ["owner", "repo", "issueNumber", "labels"],
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
        description: "Issue number",
      },
      labels: {
        type: "array",
        items: { type: "string" },
        description: "Labels to add to the issue",
      },
    },
  };

  public readonly outputSchema = {
    type: "object",
    properties: {
      success: {
        type: "boolean",
        description: "Whether labels were successfully added",
      },
      labels: {
        type: "array",
        items: { type: "string" },
        description: "Labels now on the issue",
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
    if (
      !Array.isArray(config.labels) ||
      config.labels.length === 0 ||
      !config.labels.every((l) => typeof l === "string")
    ) {
      throw new Error('Invalid "labels": must be a non-empty array of strings');
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
