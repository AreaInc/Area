import { Injectable } from "@nestjs/common";
import { ITrigger, TriggerType } from "../../../common/types/trigger.interface";

@Injectable()
export class NewTrackPlayedTrigger implements ITrigger {
  id = "new_track_played";
  name = "New Track Played";
  description = "Triggers when a new track is played";
  serviceProvider = "spotify";
  triggerType = TriggerType.POLLING;
  requiresCredentials = true;

  configSchema = {
    type: "object",
    properties: {}, // No config needed, triggers on any new track
  };

  outputSchema = {
    type: "object",
    properties: {
      trackId: { type: "string" },
      trackName: { type: "string" },
      artistName: { type: "string" },
      album: { type: "string" },
      uri: { type: "string" },
      playedAt: { type: "string" },
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
export class NewLikedSongTrigger implements ITrigger {
  id = "new_liked_song";
  name = "New Liked Song";
  description = "Triggers when a new song is liked";
  serviceProvider = "spotify";
  triggerType = TriggerType.POLLING;
  requiresCredentials = true;

  configSchema = {
    type: "object",
    properties: {},
  };

  outputSchema = {
    type: "object",
    properties: {
      trackId: { type: "string" },
      trackName: { type: "string" },
      artistName: { type: "string" },
      album: { type: "string" },
      uri: { type: "string" },
      likedAt: { type: "string" },
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
