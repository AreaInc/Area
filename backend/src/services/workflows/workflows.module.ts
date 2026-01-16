import { Module } from "@nestjs/common";
import { WorkflowsService } from "./workflows.service";
import { DrizzleModule } from "../../db/drizzle.module";
import { TemporalModule } from "../temporal/temporal.module";
import { TriggerRegistryService } from "../registries/trigger-registry.service";
import { ActionRegistryService } from "../registries/action-registry.service";
import { WORKFLOWS_SERVICE } from "./workflows.constants";

@Module({
  imports: [DrizzleModule, TemporalModule],
  providers: [
    WorkflowsService,
    TriggerRegistryService,
    ActionRegistryService,
    { provide: WORKFLOWS_SERVICE, useExisting: WorkflowsService },
  ],
  exports: [
    WorkflowsService,
    TriggerRegistryService,
    ActionRegistryService,
    WORKFLOWS_SERVICE,
  ],
})
export class WorkflowsModule {}
