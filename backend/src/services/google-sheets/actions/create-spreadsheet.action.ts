import { Injectable } from "@nestjs/common";
import { IAction, ActionMetadata } from "../../../common/types/action.interface";
import { ActionType, ServiceProvider } from "../../../common/types/enums";

@Injectable()
export class CreateSpreadsheetAction implements IAction {
    public readonly id = "create_spreadsheet";
    public readonly name = "Create Spreadsheet";
    public readonly description = "Creates a new Google Spreadsheet";
    public readonly type = ActionType.CREATE_DOCUMENT;
    public readonly serviceProvider = ServiceProvider.GOOGLE_SHEETS;
    public readonly requiresCredentials = true;

    public readonly inputSchema = {
        type: "object",
        required: ["title"],
        properties: {
            title: { type: "string", description: "Title of the new spreadsheet" },
        },
    };

    public readonly outputSchema = {
        type: "object",
        properties: {
            spreadsheetId: { type: "string" },
            spreadsheetUrl: { type: "string" },
        },
    };

    async validateInput(config: Record<string, any>): Promise<boolean> {
        if (!config.title || typeof config.title !== 'string') {
            throw new Error('Invalid "title": must be a non-empty string');
        }
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
