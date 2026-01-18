import { Injectable } from "@nestjs/common";
import {
  IAction,
  ActionMetadata,
} from "../../../common/types/action.interface";
import { ActionType, ServiceProvider } from "../../../common/types/enums";

@Injectable()
export class PlayMusicAction implements IAction {
  public readonly id = "play_music";
  public readonly name = "Play Music";
  public readonly description = "Plays a track";
  public readonly type = ActionType.CREATE_DOCUMENT; // Using closest matching type
  public readonly serviceProvider = ServiceProvider.SPOTIFY;
  public readonly requiresCredentials = true;

  public readonly inputSchema = {
    type: "object",
    required: ["trackUri"],
    properties: {
      trackUri: { type: "string", description: "Spotify Track URI" },
    },
  };

  async validateInput(config: Record<string, any>): Promise<boolean> {
    return !!config.trackUri;
  }
  getMetadata(): ActionMetadata {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      serviceProvider: this.serviceProvider,
      inputSchema: this.inputSchema,
      requiresCredentials: this.requiresCredentials,
    };
  }
}

@Injectable()
export class AddToPlaylistAction implements IAction {
  public readonly id = "add_to_playlist";
  public readonly name = "Add to Playlist";
  public readonly description = "Adds a track to a playlist";
  public readonly type = ActionType.CREATE_DOCUMENT;
  public readonly serviceProvider = ServiceProvider.SPOTIFY;
  public readonly requiresCredentials = true;

  public readonly inputSchema = {
    type: "object",
    required: ["playlistId", "trackUri"],
    properties: {
      playlistId: { type: "string", description: "Spotify Playlist ID" },
      trackUri: { type: "string", description: "Spotify Track URI" },
    },
  };

  async validateInput(config: Record<string, any>): Promise<boolean> {
    return !!config.playlistId && !!config.trackUri;
  }
  getMetadata(): ActionMetadata {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      serviceProvider: this.serviceProvider,
      inputSchema: this.inputSchema,
      requiresCredentials: this.requiresCredentials,
    };
  }
}

@Injectable()
export class CreatePlaylistAction implements IAction {
  public readonly id = "create_playlist";
  public readonly name = "Create Playlist";
  public readonly description = "Creates a new playlist";
  public readonly type = ActionType.CREATE_DOCUMENT;
  public readonly serviceProvider = ServiceProvider.SPOTIFY;
  public readonly requiresCredentials = true;

  public readonly inputSchema = {
    type: "object",
    required: ["name"],
    properties: {
      name: { type: "string" },
      description: { type: "string" },
    },
  };

  async validateInput(config: Record<string, any>): Promise<boolean> {
    return !!config.name;
  }
  getMetadata(): ActionMetadata {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      serviceProvider: this.serviceProvider,
      inputSchema: this.inputSchema,
      requiresCredentials: this.requiresCredentials,
    };
  }
}

@Injectable()
export class SkipTrackAction implements IAction {
  public readonly id = "skip_track";
  public readonly name = "Skip Track";
  public readonly description = "Skips to the next track";
  public readonly type = ActionType.CREATE_DOCUMENT;
  public readonly serviceProvider = ServiceProvider.SPOTIFY;
  public readonly requiresCredentials = true;

  public readonly inputSchema = {
    type: "object",
    properties: {},
  };

  async validateInput(config: Record<string, any>): Promise<boolean> {
    return true;
  }
  getMetadata(): ActionMetadata {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      serviceProvider: this.serviceProvider,
      inputSchema: this.inputSchema,
      requiresCredentials: this.requiresCredentials,
    };
  }
}

@Injectable()
export class PausePlaybackAction implements IAction {
  public readonly id = "pause_playback";
  public readonly name = "Pause Playback";
  public readonly description = "Pauses playback";
  public readonly type = ActionType.CREATE_DOCUMENT;
  public readonly serviceProvider = ServiceProvider.SPOTIFY;
  public readonly requiresCredentials = true;

  public readonly inputSchema = {
    type: "object",
    properties: {},
  };

  async validateInput(config: Record<string, any>): Promise<boolean> {
    return true;
  }
  getMetadata(): ActionMetadata {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      serviceProvider: this.serviceProvider,
      inputSchema: this.inputSchema,
      requiresCredentials: this.requiresCredentials,
    };
  }
}

@Injectable()
export class LikeCurrentTrackAction implements IAction {
  public readonly id = "like_current_track";
  public readonly name = "Like Current Track";
  public readonly description = "Likes the currently playing track";
  public readonly type = ActionType.CREATE_DOCUMENT;
  public readonly serviceProvider = ServiceProvider.SPOTIFY;
  public readonly requiresCredentials = true;

  public readonly inputSchema = {
    type: "object",
    properties: {},
  };

  async validateInput(config: Record<string, any>): Promise<boolean> {
    return true;
  }
  getMetadata(): ActionMetadata {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      serviceProvider: this.serviceProvider,
      inputSchema: this.inputSchema,
      requiresCredentials: this.requiresCredentials,
    };
  }
}
