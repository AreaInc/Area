import { Injectable } from "@nestjs/common";
import { IAction, ActionMetadata } from "../../../common/types/action.interface";

@Injectable()
export class SendPhotoAction implements IAction {
    id = "send-photo";
    name = "Send Telegram Photo";
    description = "Send a photo to a Telegram chat";
    serviceProvider = "telegram";
    requiresCredentials = false;

    inputSchema = {
        type: "object",
        required: ["botToken", "chatId", "photo"],
        properties: {
            botToken: { type: "string", description: "Telegram Bot Token" },
            chatId: { type: "string", description: "Target Chat ID" },
            photo: { type: "string", description: "Photo URL" },
            caption: { type: "string", description: "Photo Caption (Optional)" }
        }
    };

    outputSchema = {
        type: "object",
        properties: {
            delivered: { type: "boolean" },
            status: { type: "number" },
            messageId: { type: "number" }
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
