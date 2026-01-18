import { Injectable } from "@nestjs/common";
import { ITrigger, TriggerType } from "../../../common/types/trigger.interface";

@Injectable()
export class StreamStartedTrigger implements ITrigger {
  id = "stream_started";
  name = "Stream Started";
  description = "Triggers when the stream starts";
  serviceProvider = "twitch";
  triggerType = TriggerType.POLLING;
  requiresCredentials = true;

  configSchema = { type: "object", properties: {} };
  outputSchema = {
    type: "object",
    properties: { startedAt: { type: "string" }, title: { type: "string" } },
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
    return true;
  }
  getRegistrations() {
    return this.workflowRegistrations;
  }
}

@Injectable()
export class StreamEndedTrigger implements ITrigger {
  id = "stream_ended";
  name = "Stream Ended";
  description = "Triggers when the stream ends";
  serviceProvider = "twitch";
  triggerType = TriggerType.POLLING;
  requiresCredentials = true;

  configSchema = { type: "object", properties: {} };
  outputSchema = {
    type: "object",
    properties: { endedAt: { type: "string" } },
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
    return true;
  }
  getRegistrations() {
    return this.workflowRegistrations;
  }
}

@Injectable()
export class NewFollowerTrigger implements ITrigger {
  id = "new_follower";
  name = "New Follower";
  description = "Triggers when the channel gets a new follower";
  serviceProvider = "twitch";
  triggerType = TriggerType.POLLING;
  requiresCredentials = true;

  configSchema = { type: "object", properties: {} };
  outputSchema = {
    type: "object",
    properties: {
      followerName: { type: "string" },
      followerId: { type: "string" },
      followedAt: { type: "string" },
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
    return true;
  }
  getRegistrations() {
    return this.workflowRegistrations;
  }
}

@Injectable()
export class ViewerCountThresholdTrigger implements ITrigger {
  id = "viewer_count_threshold";
  name = "Viewer Count Threshold";
  description = "Triggers when viewer count exceeds a value";
  serviceProvider = "twitch";
  triggerType = TriggerType.POLLING;
  requiresCredentials = true;

  configSchema = {
    type: "object",
    required: ["threshold"],
    properties: { threshold: { type: "number" } },
  };
  outputSchema = {
    type: "object",
    properties: { viewerCount: { type: "number" } },
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
    return typeof config.threshold === "number";
  }
  getRegistrations() {
    return this.workflowRegistrations;
  }
}
