import { Injectable } from "@nestjs/common";
import {
  IAction,
  ActionMetadata,
} from "../../../common/types/action.interface";
import { ActionType, ServiceProvider } from "../../../common/types/enums";

@Injectable()
export class CreatePlaylistAction implements IAction {
  public readonly id = "create_playlist";
  public readonly name = "Create Playlist";
  public readonly description = "Creates a new private playlist";
  public readonly type = ActionType.CREATE_DOCUMENT;
  public readonly serviceProvider = ServiceProvider.YOUTUBE;
  public readonly requiresCredentials = true;

  public readonly inputSchema = {
    type: "object",
    required: ["title"],
    properties: {
      title: { type: "string" },
      description: { type: "string" },
    },
  };

  async validateInput(config: Record<string, any>): Promise<boolean> {
    return !!config.title;
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
export class DeletePlaylistAction implements IAction {
  public readonly id = "delete_playlist";
  public readonly name = "Delete Playlist";
  public readonly description = "Deletes a playlist by name";
  public readonly type = ActionType.DELETE_DOCUMENT;
  public readonly serviceProvider = ServiceProvider.YOUTUBE;
  public readonly requiresCredentials = true;

  public readonly inputSchema = {
    type: "object",
    required: ["playlistName"],
    properties: {
      playlistName: { type: "string" },
    },
  };

  async validateInput(config: Record<string, any>): Promise<boolean> {
    return !!config.playlistName;
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
export class RateVideoAction implements IAction {
  public readonly id = "rate_video";
  public readonly name = "Rate Video";
  public readonly description =
    "Likes, dislikes, or removes rating from a video";
  public readonly type = ActionType.CREATE_DOCUMENT;
  public readonly serviceProvider = ServiceProvider.YOUTUBE;
  public readonly requiresCredentials = true;

  public readonly inputSchema = {
    type: "object",
    required: ["videoId", "rating"],
    properties: {
      videoId: { type: "string" },
      rating: { type: "string", enum: ["like", "dislike", "none"] },
    },
  };

  async validateInput(config: Record<string, any>): Promise<boolean> {
    return (
      !!config.videoId && ["like", "dislike", "none"].includes(config.rating)
    );
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
export class SubscribeChannelAction implements IAction {
  public readonly id = "subscribe_channel";
  public readonly name = "Subscribe to Channel";
  public readonly description = "Subscribes to a YouTube channel";
  public readonly type = ActionType.CREATE_DOCUMENT;
  public readonly serviceProvider = ServiceProvider.YOUTUBE;
  public readonly requiresCredentials = true;

  public readonly inputSchema = {
    type: "object",
    required: ["channelName"],
    properties: {
      channelName: { type: "string" },
    },
  };

  async validateInput(config: Record<string, any>): Promise<boolean> {
    return !!config.channelName;
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
export class UnsubscribeChannelAction implements IAction {
  public readonly id = "unsubscribe_channel";
  public readonly name = "Unsubscribe from Channel";
  public readonly description = "Unsubscribes from a YouTube channel";
  public readonly type = ActionType.DELETE_DOCUMENT;
  public readonly serviceProvider = ServiceProvider.YOUTUBE;
  public readonly requiresCredentials = true;

  public readonly inputSchema = {
    type: "object",
    required: ["channelName"],
    properties: {
      channelName: { type: "string" },
    },
  };

  async validateInput(config: Record<string, any>): Promise<boolean> {
    return !!config.channelName;
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
export class CommentVideoAction implements IAction {
  public readonly id = "comment_video";
  public readonly name = "Comment on Video";
  public readonly description = "Posts a comment on a video";
  public readonly type = ActionType.SEND_MESSAGE;
  public readonly serviceProvider = ServiceProvider.YOUTUBE;
  public readonly requiresCredentials = true;

  public readonly inputSchema = {
    type: "object",
    required: ["videoId", "comment"],
    properties: {
      videoId: { type: "string" },
      comment: { type: "string" },
    },
  };

  async validateInput(config: Record<string, any>): Promise<boolean> {
    return !!config.videoId && !!config.comment;
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
