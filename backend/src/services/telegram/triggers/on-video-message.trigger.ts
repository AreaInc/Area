import { Injectable } from "@nestjs/common";
import { ITrigger, TriggerMetadata, TriggerType } from "../../../common/types/trigger.interface";

@Injectable()
export class OnVideoMessageTrigger implements ITrigger {
    id = "on-video-message";
    name = "On Video Message";
    description = "Triggers when a video or video note is sent";
    serviceProvider = "telegram";
    triggerType = TriggerType.POLLING;
    requiresCredentials = true;

    configSchema = {
        type: "object",
        required: ["botToken"],
        properties: {
            botToken: { type: "string", description: "Telegram Bot Token" }
        }
    };

    async register(workflowId: number, config: Record<string, any>): Promise<void> {
        // Polling triggers don't need explicit registration with external service
        return;
    }

    async unregister(workflowId: number): Promise<void> {
        // Polling triggers don't need explicit unregistration
        return;
    }

    async validateConfig(config: Record<string, any>): Promise<boolean> {
        return !!config.botToken;
    }

    getMetadata(): TriggerMetadata {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            serviceProvider: this.serviceProvider,
            triggerType: this.triggerType,
            configSchema: this.configSchema,
            requiresCredentials: this.requiresCredentials
        };
    }
}
