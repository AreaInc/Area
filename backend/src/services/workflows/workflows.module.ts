import { Module } from "@nestjs/common";
import { WorkflowsService } from "./workflows.service";
import { DrizzleModule } from "../../db/drizzle.module";
import { TemporalModule } from "../temporal/temporal.module";
import { TriggerRegistryService } from "../registries/trigger-registry.service";
import { ActionRegistryService } from "../registries/action-registry.service";

@Module({
  imports: [DrizzleModule, TemporalModule],
  providers: [WorkflowsService, TriggerRegistryService, ActionRegistryService],
  exports: [WorkflowsService, TriggerRegistryService, ActionRegistryService],
})
export class WorkflowsModule {}
