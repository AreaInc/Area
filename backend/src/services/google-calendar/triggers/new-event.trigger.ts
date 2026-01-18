import { Injectable } from "@nestjs/common";
import {
    ITrigger,
    TriggerType,
} from "../../../common/types/trigger.interface";

@Injectable()
export class NewEventTrigger implements ITrigger {
    id = "google-calendar:new-event";
    name = "New Calendar Event";
    description = "Triggers when a new event is created";
    serviceProvider = "google-calendar";
    triggerType = TriggerType.POLLING;
    requiresCredentials = true;

    configSchema = {
        type: "object",
        properties: {
            calendarId: {
                type: "string",
                description: "Calendar ID (default: primary)",
                default: "primary",
            },
        },
    };

    outputSchema = {
        type: "object",
        properties: {
            eventId: { type: "string" },
            summary: { type: "string" },
            description: { type: "string" },
            location: { type: "string" },
            start: { type: "string" },
            end: { type: "string" },
            link: { type: "string" },
        },
    };

    private registrations = new Map<number, {
        credentialsId?: number;
        config: Record<string, any>;
    }>();

    async register(workflowId: number, config: Record<string, any>, credentialsId?: number): Promise<void> {
        this.registrations.set(workflowId, { credentialsId, config });
    }

    async unregister(workflowId: number): Promise<void> {
        this.registrations.delete(workflowId);
    }

    async validateConfig(config: Record<string, any>): Promise<boolean> {
        return true;
    }

    getRegistrations() {
        return this.registrations;
    }
}
