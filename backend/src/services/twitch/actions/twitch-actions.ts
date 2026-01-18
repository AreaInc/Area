import { Injectable } from "@nestjs/common";
import {
  IAction,
  ActionMetadata,
} from "../../../common/types/action.interface";
import { ActionType, ServiceProvider } from "../../../common/types/enums";

@Injectable()
export class UpdateStreamTitleAction implements IAction {
  public readonly id = "update_stream_title";
  public readonly name = "Update Stream Title";
  public readonly description = "Updates the channel's stream title";
  public readonly type = ActionType.CREATE_DOCUMENT;
  public readonly serviceProvider = ServiceProvider.TWITCH;
  public readonly requiresCredentials = true;

  public readonly inputSchema = {
    type: "object",
    required: ["title"],
    properties: {
      title: { type: "string" },
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
export class UpdateStreamGameAction implements IAction {
  public readonly id = "update_stream_game";
  public readonly name = "Update Stream Game";
  public readonly description = "Updates the channel's game/category";
  public readonly type = ActionType.CREATE_DOCUMENT;
  public readonly serviceProvider = ServiceProvider.TWITCH;
  public readonly requiresCredentials = true;

  public readonly inputSchema = {
    type: "object",
    required: ["gameName"],
    properties: {
      gameName: { type: "string" },
    },
  };

  async validateInput(config: Record<string, any>): Promise<boolean> {
    return !!config.gameName;
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
export class SendChatMessageAction implements IAction {
  public readonly id = "send_chat_message";
  public readonly name = "Send Chat Message";
  public readonly description = "Sends a message to the chat";
  public readonly type = ActionType.SEND_MESSAGE;
  public readonly serviceProvider = ServiceProvider.TWITCH;
  public readonly requiresCredentials = true;

  public readonly inputSchema = {
    type: "object",
    required: ["message"],
    properties: {
      message: { type: "string" },
    },
  };

  async validateInput(config: Record<string, any>): Promise<boolean> {
    return !!config.message;
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
export class CreateClipAction implements IAction {
  public readonly id = "create_clip";
  public readonly name = "Create Clip";
  public readonly description = "Creates a clip of the stream";
  public readonly type = ActionType.CREATE_DOCUMENT;
  public readonly serviceProvider = ServiceProvider.TWITCH;
  public readonly requiresCredentials = true;

  public readonly inputSchema = {
    type: "object",
    properties: {
      hasDelay: {
        type: "boolean",
        description: "If true, capture slightly delayed",
      },
    },
  };

  async validateInput(_config: Record<string, any>): Promise<boolean> {
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
export class StartCommercialAction implements IAction {
  public readonly id = "start_commercial";
  public readonly name = "Start Commercial";
  public readonly description = "Starts a commercial break";
  public readonly type = ActionType.CREATE_DOCUMENT; // Or custom
  public readonly serviceProvider = ServiceProvider.TWITCH;
  public readonly requiresCredentials = true;

  public readonly inputSchema = {
    type: "object",
    required: ["length"],
    properties: {
      length: { type: "number", enum: [30, 60, 90, 120, 150, 180] },
    },
  };

  async validateInput(config: Record<string, any>): Promise<boolean> {
    return [30, 60, 90, 120, 150, 180].includes(config.length);
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
export class CreateStreamMarkerAction implements IAction {
  public readonly id = "create_stream_marker";
  public readonly name = "Create Stream Marker";
  public readonly description = "Creates a marker in the stream VOD";
  public readonly type = ActionType.CREATE_DOCUMENT;
  public readonly serviceProvider = ServiceProvider.TWITCH;
  public readonly requiresCredentials = true;

  public readonly inputSchema = {
    type: "object",
    properties: {
      description: { type: "string" },
    },
  };

  async validateInput(_config: Record<string, any>): Promise<boolean> {
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
