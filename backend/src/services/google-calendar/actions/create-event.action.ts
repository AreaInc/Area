import { Injectable } from "@nestjs/common";
import {
  IAction,
  ActionMetadata,
} from "../../../common/types/action.interface";

@Injectable()
export class CreateEventAction implements IAction {
  id = "google-calendar:create-event";
  name = "Create Event";
  description = "Create a new event in Google Calendar";
  serviceProvider = "google-calendar";
  requiresCredentials = true;

  inputSchema = {
    type: "object",
    required: ["summary", "start", "end"],
    properties: {
      calendarId: {
        type: "string",
        description: "Calendar ID (default: primary)",
        example: "primary",
      },
      summary: {
        type: "string",
        description: "Event title",
        example: "Meeting with Team",
      },
      description: {
        type: "string",
        description: "Event description",
        example: "Discuss project updates",
      },
      location: {
        type: "string",
        description: "Event location",
        example: "Conference Room A",
      },
      start: {
        type: "string",
        description: "Start time (ISO 8601)",
        example: "2023-10-27T10:00:00Z",
      },
      end: {
        type: "string",
        description: "End time (ISO 8601)",
        example: "2023-10-27T11:00:00Z",
      },
      attendees: {
        type: "array",
        items: { type: "string" },
        description: "List of attendee emails",
      },
    },
  };

  outputSchema = {
    type: "object",
    properties: {
      id: { type: "string", description: "Event ID" },
      htmlLink: { type: "string", description: "Link to event" },
      success: { type: "boolean" },
    },
  };

  async validateInput(config: Record<string, any>): Promise<boolean> {
    if (!config.summary) throw new Error("Summary is required");
    if (!config.start) throw new Error("Start time is required");
    if (!config.end) throw new Error("End time is required");
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
