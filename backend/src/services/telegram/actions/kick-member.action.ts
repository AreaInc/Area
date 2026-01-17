import { Injectable } from "@nestjs/common";
import { IAction, ActionMetadata } from "../../../common/types/action.interface";

@Injectable()
export class KickMemberAction implements IAction {
    id = "kick-member";
    name = "Kick Telegram Member";
    description = "Kick (ban) a user from a Telegram group";
    serviceProvider = "telegram";
    requiresCredentials = false;

    inputSchema = {
        type: "object",
        required: ["botToken", "chatId", "userId"],
        properties: {
            botToken: { type: "string", description: "Telegram Bot Token" },
            chatId: { type: "string", description: "Group Chat ID" },
            userId: { type: "string", description: "User ID to kick" },
            untilDate: { type: "number", description: "Ban until (unix timestamp, optional)" },
            revokeMessages: { type: "boolean", description: "Delete all messages from user" }
        }
    };

    outputSchema = {
        type: "object",
        properties: {
            success: { type: "boolean" },
            error: { type: "string" }
        }
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
            outputSchema: this.outputSchema,
            requiresCredentials: this.requiresCredentials
        };
    }
}
