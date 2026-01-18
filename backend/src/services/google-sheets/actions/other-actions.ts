import { Injectable } from "@nestjs/common";
import {
  IAction,
  ActionMetadata,
} from "../../../common/types/action.interface";
import { ActionType, ServiceProvider } from "../../../common/types/enums";

@Injectable()
export class UpdateCellAction implements IAction {
  public readonly id = "write_in_cell";
  public readonly name = "Write in Cell";
  public readonly description = "Updates a cell value";
  public readonly type = ActionType.CREATE_DOCUMENT;
  public readonly serviceProvider = ServiceProvider.GOOGLE_SHEETS;
  public readonly requiresCredentials = true;

  public readonly inputSchema = {
    type: "object",
    required: ["spreadsheetId", "range", "value"],
    properties: {
      spreadsheetId: { type: "string" },
      range: { type: "string", description: "A1 notation e.g. Sheet1!A1" },
      value: { type: "string" },
    },
  };

  async validateInput(config: Record<string, any>): Promise<boolean> {
    return (
      !!config.spreadsheetId && !!config.range && config.value !== undefined
    );
  }
  getMetadata(): ActionMetadata {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      serviceProvider: this.serviceProvider,
      inputSchema: this.inputSchema,
      requiresCredentials: this.requiresCredentials,
    };
  }
}

@Injectable()
export class CreateSheetAction implements IAction {
  public readonly id = "create_sheet";
  public readonly name = "Create Sheet";
  public readonly description = "Adds a new sheet/tab";
  public readonly type = ActionType.CREATE_DOCUMENT;
  public readonly serviceProvider = ServiceProvider.GOOGLE_SHEETS;
  public readonly requiresCredentials = true;

  public readonly inputSchema = {
    type: "object",
    required: ["spreadsheetId", "sheetTitle"],
    properties: {
      spreadsheetId: { type: "string" },
      sheetTitle: { type: "string" },
    },
  };

  async validateInput(config: Record<string, any>): Promise<boolean> {
    return !!config.spreadsheetId && !!config.sheetTitle;
  }
  getMetadata(): ActionMetadata {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      serviceProvider: this.serviceProvider,
      inputSchema: this.inputSchema,
      requiresCredentials: this.requiresCredentials,
    };
  }
}

@Injectable()
export class ClearRangeAction implements IAction {
  public readonly id = "clear_in_range";
  public readonly name = "Clear Range";
  public readonly description = "Clears values in a range";
  public readonly type = ActionType.CREATE_DOCUMENT;
  public readonly serviceProvider = ServiceProvider.GOOGLE_SHEETS;
  public readonly requiresCredentials = true;

  public readonly inputSchema = {
    type: "object",
    required: ["spreadsheetId", "range"],
    properties: {
      spreadsheetId: { type: "string" },
      range: { type: "string" },
    },
  };

  async validateInput(config: Record<string, any>): Promise<boolean> {
    return !!config.spreadsheetId && !!config.range;
  }
  getMetadata(): ActionMetadata {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      serviceProvider: this.serviceProvider,
      inputSchema: this.inputSchema,
      requiresCredentials: this.requiresCredentials,
    };
  }
}

@Injectable()
export class DuplicateSheetAction implements IAction {
  public readonly id = "duplicate_sheet";
  public readonly name = "Duplicate Spreadsheet";
  public readonly description = "Duplicates a spreadsheet file";
  public readonly type = ActionType.CREATE_DOCUMENT;
  public readonly serviceProvider = ServiceProvider.GOOGLE_SHEETS;
  public readonly requiresCredentials = true;

  public readonly inputSchema = {
    type: "object",
    required: ["spreadsheetId", "newTitle"],
    properties: {
      spreadsheetId: { type: "string" },
      newTitle: { type: "string" },
    },
  };

  async validateInput(config: Record<string, any>): Promise<boolean> {
    return !!config.spreadsheetId && !!config.newTitle;
  }
  getMetadata(): ActionMetadata {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      serviceProvider: this.serviceProvider,
      inputSchema: this.inputSchema,
      requiresCredentials: this.requiresCredentials,
    };
  }
}

@Injectable()
export class FindReplaceAction implements IAction {
  public readonly id = "find_to_replace";
  public readonly name = "Find and Replace";
  public readonly description = "Finds and replaces text";
  public readonly type = ActionType.CREATE_DOCUMENT;
  public readonly serviceProvider = ServiceProvider.GOOGLE_SHEETS;
  public readonly requiresCredentials = true;

  public readonly inputSchema = {
    type: "object",
    required: ["spreadsheetId", "find", "replacement"],
    properties: {
      spreadsheetId: { type: "string" },
      find: { type: "string" },
      replacement: { type: "string" },
      sheetId: { type: "number" },
    },
  };

  async validateInput(config: Record<string, any>): Promise<boolean> {
    return (
      !!config.spreadsheetId &&
      !!config.find &&
      config.replacement !== undefined
    );
  }
  getMetadata(): ActionMetadata {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      serviceProvider: this.serviceProvider,
      inputSchema: this.inputSchema,
      requiresCredentials: this.requiresCredentials,
    };
  }
}

@Injectable()
export class SortRangeAction implements IAction {
  public readonly id = "sort_data_in_range";
  public readonly name = "Sort Range";
  public readonly description = "Sorts a range of data";
  public readonly type = ActionType.CREATE_DOCUMENT;
  public readonly serviceProvider = ServiceProvider.GOOGLE_SHEETS;
  public readonly requiresCredentials = true;

  public readonly inputSchema = {
    type: "object",
    required: ["spreadsheetId", "range"],
    properties: {
      spreadsheetId: { type: "string" },
      range: { type: "string" },
      sortColumn: { type: "string", description: "Column letter" },
      ascending: { type: "boolean", default: true },
    },
  };

  async validateInput(config: Record<string, any>): Promise<boolean> {
    return !!config.spreadsheetId && !!config.range;
  }
  getMetadata(): ActionMetadata {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      serviceProvider: this.serviceProvider,
      inputSchema: this.inputSchema,
      requiresCredentials: this.requiresCredentials,
    };
  }
}
