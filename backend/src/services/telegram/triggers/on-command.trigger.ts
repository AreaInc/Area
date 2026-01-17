import { Injectable } from "@nestjs/common";
import { ITrigger, TriggerMetadata, TriggerType } from "../../../common/types/trigger.interface";

@Injectable()
export class OnCommandTrigger implements ITrigger {
    id = "on-command";
    name = "On Command (Telegram)";
    description = "Triggers when a Telegram bot receives a specific command";
    serviceProvider = "telegram";
    triggerType = TriggerType.POLLING;
    requiresCredentials = false;

    configSchema = {
        type: "object",
        required: ["botToken", "command"],
        properties: {
            botToken: { type: "string", description: "Telegram Bot Token" },
            command: { type: "string", description: "Command (e.g., 'start')" }
        }
    };

    async validateConfig(config: Record<string, any>): Promise<boolean> {
        if (!config.botToken) throw new Error("Bot Token is required");
        if (!config.command) throw new Error("Command is required");
        return true;
    }

    async register(workflowId: number, config: Record<string, any>): Promise<void> {
    }

    async unregister(workflowId: number): Promise<void> {
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
