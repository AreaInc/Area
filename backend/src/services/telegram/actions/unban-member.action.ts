import { Injectable } from "@nestjs/common";
import { IAction, ActionMetadata } from "../../../common/types/action.interface";

@Injectable()
export class UnbanMemberAction implements IAction {
    id = "unban-member";
    name = "Unban Telegram Member";
    description = "Unban a user from a Telegram group";
    serviceProvider = "telegram";
    requiresCredentials = false;

    inputSchema = {
        type: "object",
        required: ["botToken", "chatId", "userId"],
        properties: {
            botToken: { type: "string", description: "Telegram Bot Token" },
            chatId: { type: "string", description: "Group Chat ID" },
            userId: { type: "string", description: "User ID to unban" },
            onlyIfBanned: { type: "boolean", description: "Do nothing if user is not banned" }
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
