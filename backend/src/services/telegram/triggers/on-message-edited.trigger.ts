import { Injectable } from "@nestjs/common";
import { ITrigger, TriggerMetadata, TriggerType } from "../../../common/types/trigger.interface";

@Injectable()
export class OnMessageEditedTrigger implements ITrigger {
    id = "on-message-edited";
    name = "On Message Edited";
    description = "Triggers when a message is edited";
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
        return;
    }

    async unregister(workflowId: number): Promise<void> {
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
