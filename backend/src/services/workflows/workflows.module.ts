import { Module } from "@nestjs/common";
import { WorkflowsService } from "./workflows.service";
import { DrizzleModule } from "../../db/drizzle.module";
import { TemporalModule } from "../temporal/temporal.module";
import { WORKFLOWS_SERVICE } from "./workflows.constants";

@Module({
  imports: [DrizzleModule, TemporalModule],
  providers: [
    WorkflowsService,
    { provide: WORKFLOWS_SERVICE, useExisting: WorkflowsService },
  ],
  exports: [
    WorkflowsService,
    WORKFLOWS_SERVICE,
  ],
})
export class WorkflowsModule {}
