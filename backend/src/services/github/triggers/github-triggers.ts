import { Injectable } from "@nestjs/common";
import { ITrigger } from "../../../common/types/trigger.interface";
import { TriggerType } from "../../../common/types/enums";

@Injectable()
export class NewStarTrigger implements ITrigger {
  id = "new_star";
  name = "New Star";
  description = "Triggers when someone stars a repository";
  serviceProvider = "github";
  triggerType = TriggerType.WEBHOOK;
  requiresCredentials = false;

  configSchema = {
    type: "object",
    required: ["owner", "repo"],
    properties: {
      owner: {
        type: "string",
        description: "Repository owner",
      },
      repo: {
        type: "string",
        description: "Repository name",
      },
    },
  };

  outputSchema = {
    type: "object",
    properties: {
      action: { type: "string" },
      repository: {
        type: "object",
        properties: {
          name: { type: "string" },
          fullName: { type: "string" },
          url: { type: "string" },
        },
      },
      sender: {
        type: "object",
        properties: {
          login: { type: "string" },
          url: { type: "string" },
        },
      },
      starredAt: { type: "string" },
    },
  };

  private workflowRegistrations = new Map<
    number,
    { config: Record<string, any>; credentialsId?: number }
  >();

  async register(
    workflowId: number,
    config: Record<string, any>,
    credentialsId?: number,
  ): Promise<void> {
    this.workflowRegistrations.set(workflowId, { config, credentialsId });
  }

  async unregister(workflowId: number): Promise<void> {
    this.workflowRegistrations.delete(workflowId);
  }

  async validateConfig(config: Record<string, any>): Promise<boolean> {
    if (!config.owner || typeof config.owner !== "string") {
      throw new Error('Invalid "owner": must be a non-empty string');
    }
    if (!config.repo || typeof config.repo !== "string") {
      throw new Error('Invalid "repo": must be a non-empty string');
    }
    return true;
  }

  getRegistrations() {
    return this.workflowRegistrations;
  }
}

@Injectable()
export class NewIssueTrigger implements ITrigger {
  id = "new_issue";
  name = "New Issue Created";
  description = "Triggers when a new issue is created in a repository";
  serviceProvider = "github";
  triggerType = TriggerType.WEBHOOK;
  requiresCredentials = false;

  configSchema = {
    type: "object",
    required: ["owner", "repo"],
    properties: {
      owner: {
        type: "string",
        description: "Repository owner",
      },
      repo: {
        type: "string",
        description: "Repository name",
      },
    },
  };

  outputSchema = {
    type: "object",
    properties: {
      action: { type: "string" },
      issue: {
        type: "object",
        properties: {
          number: { type: "number" },
          title: { type: "string" },
          body: { type: "string" },
          state: { type: "string" },
          url: { type: "string" },
          labels: { type: "array", items: { type: "string" } },
        },
      },
      repository: {
        type: "object",
        properties: {
          name: { type: "string" },
          fullName: { type: "string" },
        },
      },
      sender: {
        type: "object",
        properties: {
          login: { type: "string" },
        },
      },
    },
  };

  private workflowRegistrations = new Map<
    number,
    { config: Record<string, any>; credentialsId?: number }
  >();

  async register(
    workflowId: number,
    config: Record<string, any>,
    credentialsId?: number,
  ): Promise<void> {
    this.workflowRegistrations.set(workflowId, { config, credentialsId });
  }

  async unregister(workflowId: number): Promise<void> {
    this.workflowRegistrations.delete(workflowId);
  }

  async validateConfig(config: Record<string, any>): Promise<boolean> {
    if (!config.owner || typeof config.owner !== "string") {
      throw new Error('Invalid "owner": must be a non-empty string');
    }
    if (!config.repo || typeof config.repo !== "string") {
      throw new Error('Invalid "repo": must be a non-empty string');
    }
    return true;
  }

  getRegistrations() {
    return this.workflowRegistrations;
  }
}

@Injectable()
export class PushTrigger implements ITrigger {
  id = "push";
  name = "Push to Repository";
  description = "Triggers when code is pushed to a repository";
  serviceProvider = "github";
  triggerType = TriggerType.WEBHOOK;
  requiresCredentials = false;

  configSchema = {
    type: "object",
    required: ["owner", "repo"],
    properties: {
      owner: {
        type: "string",
        description: "Repository owner",
      },
      repo: {
        type: "string",
        description: "Repository name",
      },
      branch: {
        type: "string",
        description: "Specific branch to watch (optional)",
      },
    },
  };

  outputSchema = {
    type: "object",
    properties: {
      ref: { type: "string" },
      before: { type: "string" },
      after: { type: "string" },
      repository: {
        type: "object",
        properties: {
          name: { type: "string" },
          fullName: { type: "string" },
        },
      },
      pusher: {
        type: "object",
        properties: {
          name: { type: "string" },
          email: { type: "string" },
        },
      },
      commits: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            message: { type: "string" },
            author: {
              type: "object",
              properties: {
                name: { type: "string" },
                email: { type: "string" },
              },
            },
          },
        },
      },
    },
  };

  private workflowRegistrations = new Map<
    number,
    { config: Record<string, any>; credentialsId?: number }
  >();

  async register(
    workflowId: number,
    config: Record<string, any>,
    credentialsId?: number,
  ): Promise<void> {
    this.workflowRegistrations.set(workflowId, { config, credentialsId });
  }

  async unregister(workflowId: number): Promise<void> {
    this.workflowRegistrations.delete(workflowId);
  }

  async validateConfig(config: Record<string, any>): Promise<boolean> {
    if (!config.owner || typeof config.owner !== "string") {
      throw new Error('Invalid "owner": must be a non-empty string');
    }
    if (!config.repo || typeof config.repo !== "string") {
      throw new Error('Invalid "repo": must be a non-empty string');
    }
    if (config.branch !== undefined && typeof config.branch !== "string") {
      throw new Error('Invalid "branch": must be a string');
    }
    return true;
  }

  getRegistrations() {
    return this.workflowRegistrations;
  }
}

@Injectable()
export class NewPullRequestTrigger implements ITrigger {
  id = "new_pull_request";
  name = "New Pull Request";
  description = "Triggers when a new pull request is opened";
  serviceProvider = "github";
  triggerType = TriggerType.WEBHOOK;
  requiresCredentials = false;

  configSchema = {
    type: "object",
    required: ["owner", "repo"],
    properties: {
      owner: {
        type: "string",
        description: "Repository owner",
      },
      repo: {
        type: "string",
        description: "Repository name",
      },
    },
  };

  outputSchema = {
    type: "object",
    properties: {
      action: { type: "string" },
      pullRequest: {
        type: "object",
        properties: {
          number: { type: "number" },
          title: { type: "string" },
          body: { type: "string" },
          state: { type: "string" },
          url: { type: "string" },
          head: { type: "string" },
          base: { type: "string" },
        },
      },
      repository: {
        type: "object",
        properties: {
          name: { type: "string" },
          fullName: { type: "string" },
        },
      },
      sender: {
        type: "object",
        properties: {
          login: { type: "string" },
        },
      },
    },
  };

  private workflowRegistrations = new Map<
    number,
    { config: Record<string, any>; credentialsId?: number }
  >();

  async register(
    workflowId: number,
    config: Record<string, any>,
    credentialsId?: number,
  ): Promise<void> {
    this.workflowRegistrations.set(workflowId, { config, credentialsId });
  }

  async unregister(workflowId: number): Promise<void> {
    this.workflowRegistrations.delete(workflowId);
  }

  async validateConfig(config: Record<string, any>): Promise<boolean> {
    if (!config.owner || typeof config.owner !== "string") {
      throw new Error('Invalid "owner": must be a non-empty string');
    }
    if (!config.repo || typeof config.repo !== "string") {
      throw new Error('Invalid "repo": must be a non-empty string');
    }
    return true;
  }

  getRegistrations() {
    return this.workflowRegistrations;
  }
}

@Injectable()
export class IssueLabeledTrigger implements ITrigger {
  id = "issue_labeled";
  name = "Issue Labeled";
  description = "Triggers when a label is added to an issue";
  serviceProvider = "github";
  triggerType = TriggerType.WEBHOOK;
  requiresCredentials = false;

  configSchema = {
    type: "object",
    required: ["owner", "repo"],
    properties: {
      owner: {
        type: "string",
        description: "Repository owner",
      },
      repo: {
        type: "string",
        description: "Repository name",
      },
      label: {
        type: "string",
        description: "Specific label to watch for (optional)",
      },
    },
  };

  outputSchema = {
    type: "object",
    properties: {
      action: { type: "string" },
      label: {
        type: "object",
        properties: {
          name: { type: "string" },
        },
      },
      issue: {
        type: "object",
        properties: {
          number: { type: "number" },
          title: { type: "string" },
          url: { type: "string" },
        },
      },
      repository: {
        type: "object",
        properties: {
          name: { type: "string" },
          fullName: { type: "string" },
        },
      },
    },
  };

  private workflowRegistrations = new Map<
    number,
    { config: Record<string, any>; credentialsId?: number }
  >();

  async register(
    workflowId: number,
    config: Record<string, any>,
    credentialsId?: number,
  ): Promise<void> {
    this.workflowRegistrations.set(workflowId, { config, credentialsId });
  }

  async unregister(workflowId: number): Promise<void> {
    this.workflowRegistrations.delete(workflowId);
  }

  async validateConfig(config: Record<string, any>): Promise<boolean> {
    if (!config.owner || typeof config.owner !== "string") {
      throw new Error('Invalid "owner": must be a non-empty string');
    }
    if (!config.repo || typeof config.repo !== "string") {
      throw new Error('Invalid "repo": must be a non-empty string');
    }
    if (config.label !== undefined && typeof config.label !== "string") {
      throw new Error('Invalid "label": must be a string');
    }
    return true;
  }

  getRegistrations() {
    return this.workflowRegistrations;
  }
}

@Injectable()
export class PullRequestReviewRequestedTrigger implements ITrigger {
  id = "pr_review_requested";
  name = "PR Review Requested";
  description = "Triggers when a review is requested on a pull request";
  serviceProvider = "github";
  triggerType = TriggerType.WEBHOOK;
  requiresCredentials = false;

  configSchema = {
    type: "object",
    required: ["owner", "repo"],
    properties: {
      owner: {
        type: "string",
        description: "Repository owner",
      },
      repo: {
        type: "string",
        description: "Repository name",
      },
    },
  };

  outputSchema = {
    type: "object",
    properties: {
      action: { type: "string" },
      pullRequest: {
        type: "object",
        properties: {
          number: { type: "number" },
          title: { type: "string" },
          url: { type: "string" },
        },
      },
      requestedReviewer: {
        type: "object",
        properties: {
          login: { type: "string" },
        },
      },
      repository: {
        type: "object",
        properties: {
          name: { type: "string" },
          fullName: { type: "string" },
        },
      },
    },
  };

  private workflowRegistrations = new Map<
    number,
    { config: Record<string, any>; credentialsId?: number }
  >();

  async register(
    workflowId: number,
    config: Record<string, any>,
    credentialsId?: number,
  ): Promise<void> {
    this.workflowRegistrations.set(workflowId, { config, credentialsId });
  }

  async unregister(workflowId: number): Promise<void> {
    this.workflowRegistrations.delete(workflowId);
  }

  async validateConfig(config: Record<string, any>): Promise<boolean> {
    if (!config.owner || typeof config.owner !== "string") {
      throw new Error('Invalid "owner": must be a non-empty string');
    }
    if (!config.repo || typeof config.repo !== "string") {
      throw new Error('Invalid "repo": must be a non-empty string');
    }
    return true;
  }

  getRegistrations() {
    return this.workflowRegistrations;
  }
}

@Injectable()
export class ReleasePublishedTrigger implements ITrigger {
  id = "release_published";
  name = "Release Published";
  description = "Triggers when a new release is published in a repository";
  serviceProvider = "github";
  triggerType = TriggerType.WEBHOOK;
  requiresCredentials = false;

  configSchema = {
    type: "object",
    required: ["owner", "repo"],
    properties: {
      owner: {
        type: "string",
        description: "Repository owner",
      },
      repo: {
        type: "string",
        description: "Repository name",
      },
    },
  };

  outputSchema = {
    type: "object",
    properties: {
      action: { type: "string" },
      release: {
        type: "object",
        properties: {
          tagName: { type: "string" },
          name: { type: "string" },
          body: { type: "string" },
          url: { type: "string" },
          draft: { type: "boolean" },
          prerelease: { type: "boolean" },
        },
      },
      repository: {
        type: "object",
        properties: {
          name: { type: "string" },
          fullName: { type: "string" },
        },
      },
    },
  };

  private workflowRegistrations = new Map<
    number,
    { config: Record<string, any>; credentialsId?: number }
  >();

  async register(
    workflowId: number,
    config: Record<string, any>,
    credentialsId?: number,
  ): Promise<void> {
    this.workflowRegistrations.set(workflowId, { config, credentialsId });
  }

  async unregister(workflowId: number): Promise<void> {
    this.workflowRegistrations.delete(workflowId);
  }

  async validateConfig(config: Record<string, any>): Promise<boolean> {
    if (!config.owner || typeof config.owner !== "string") {
      throw new Error('Invalid "owner": must be a non-empty string');
    }
    if (!config.repo || typeof config.repo !== "string") {
      throw new Error('Invalid "repo": must be a non-empty string');
    }
    return true;
  }

  getRegistrations() {
    return this.workflowRegistrations;
  }
}
