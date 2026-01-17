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
            values: {
                oneOf: [
                    { type: "string", description: "Semicolon-separated values (e.g., 'value1;value2;value3')" },
                    { type: "array", items: { type: "string" }, description: "Array of values" }
                ],
                description: "Row values as semicolon-separated string or array"
            },
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
        if (!config.values) {
            throw new Error('Invalid "values": must be provided');
        }
        if (typeof config.values !== 'string' && !Array.isArray(config.values)) {
            throw new Error('Invalid "values": must be a semicolon-separated string or an array');
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
