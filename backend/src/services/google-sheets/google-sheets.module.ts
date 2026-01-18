import { Module, OnModuleInit } from "@nestjs/common";
import { CreateSpreadsheetAction } from "./actions/create-spreadsheet.action";
import { AddRowAction } from "./actions/add-row.action";
import {
  UpdateCellAction,
  CreateSheetAction,
  ClearRangeAction,
  DuplicateSheetAction,
  FindReplaceAction,
  SortRangeAction,
} from "./actions/other-actions";
import { ActionRegistryService } from "../registries/action-registry.service";
import { WorkflowsModule } from "../workflows/workflows.module";

@Module({
  imports: [WorkflowsModule],
  providers: [
    CreateSpreadsheetAction,
    AddRowAction,
    UpdateCellAction,
    CreateSheetAction,
    ClearRangeAction,
    DuplicateSheetAction,
    FindReplaceAction,
    SortRangeAction,
  ],
  exports: [
    CreateSpreadsheetAction,
    AddRowAction,
    UpdateCellAction,
    CreateSheetAction,
    ClearRangeAction,
    DuplicateSheetAction,
    FindReplaceAction,
    SortRangeAction,
  ],
})
export class GoogleSheetsModule implements OnModuleInit {
  constructor(
    private readonly actionRegistry: ActionRegistryService,
    private readonly createSpreadsheetAction: CreateSpreadsheetAction,
    private readonly addRowAction: AddRowAction,
    private readonly updateCellAction: UpdateCellAction,
    private readonly createSheetAction: CreateSheetAction,
    private readonly clearRangeAction: ClearRangeAction,
    private readonly duplicateSheetAction: DuplicateSheetAction,
    private readonly findReplaceAction: FindReplaceAction,
    private readonly sortRangeAction: SortRangeAction,
  ) {}

  onModuleInit() {
    console.log("[GoogleSheetsModule] Registering Google Sheets actions...");
    this.actionRegistry.register(this.createSpreadsheetAction);
    this.actionRegistry.register(this.addRowAction);
    this.actionRegistry.register(this.updateCellAction);
    this.actionRegistry.register(this.createSheetAction);
    this.actionRegistry.register(this.clearRangeAction);
    this.actionRegistry.register(this.duplicateSheetAction);
    this.actionRegistry.register(this.findReplaceAction);
    this.actionRegistry.register(this.sortRangeAction);
    console.log(
      "[GoogleSheetsModule] Google Sheets module initialized successfully",
    );
  }
}
