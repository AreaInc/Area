import { Injectable } from "@nestjs/common";
import {
    IAction,
    ActionMetadata,
} from "../../../common/types/action.interface";

@Injectable()
export class QuickAddAction implements IAction {
    id = "google-calendar:quick-add";
    name = "Quick Add Event";
    description = "Quickly add an event using natural language";
    serviceProvider = "google-calendar";
    requiresCredentials = true;

    inputSchema = {
        type: "object",
        required: ["text"],
        properties: {
            calendarId: {
                type: "string",
                description: "Calendar ID (default: primary)",
                example: "primary",
            },
            text: {
                type: "string",
                description: "Text describing the event",
                example: "Dinner with Alice tomorrow at 7pm",
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
        if (!config.text) throw new Error("Text is required");
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
