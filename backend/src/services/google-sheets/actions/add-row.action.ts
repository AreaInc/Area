import { Injectable } from "@nestjs/common";
import { IAction, ActionMetadata } from "../../../common/types/action.interface";
import { ActionType, ServiceProvider } from "../../../common/types/enums";

@Injectable()
export class AddRowAction implements IAction {
    public readonly id = "add_row";
    public readonly name = "Add Row";
    public readonly description = "Appends a row to a Google Sheet";
    public readonly type = ActionType.CREATE_DOCUMENT;
    public readonly serviceProvider = ServiceProvider.GOOGLE_SHEETS;
    public readonly requiresCredentials = true;

    public readonly inputSchema = {
        type: "object",
        required: ["spreadsheetId", "values"],
        properties: {
            spreadsheetId: { type: "string", description: "ID of the spreadsheet" },
            sheetName: { type: "string", description: "Name of the sheet (optional)" },
            values: { type: "array", items: { type: "string" }, description: "Row values" },
        },
    };

    public readonly outputSchema = {
        type: "object",
        properties: {
            updatedRange: { type: "string" },
        },
    };

    async validateInput(config: Record<string, any>): Promise<boolean> {
        if (!config.spreadsheetId || typeof config.spreadsheetId !== 'string') {
            throw new Error('Invalid "spreadsheetId": must be a string');
        }
        if (!config.values || !Array.isArray(config.values)) {
            // Maybe we want to allow string input too as per original logic, but schema says array.
            // Let's stick to array for now or allow both? original had complex parsing.
            // I'll stick to validating what schema says.
            throw new Error('Invalid "values": must be an array');
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
