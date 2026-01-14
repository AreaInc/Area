import { Module, OnModuleInit } from "@nestjs/common";
import { CronTrigger } from "./triggers/cron.trigger";
import { WorkflowsModule } from "../workflows/workflows.module";
import { TriggerRegistryService } from "../registries/trigger-registry.service";

@Module({
  imports: [WorkflowsModule],
  providers: [CronTrigger],
  exports: [CronTrigger],
})
export class SchedulerModule implements OnModuleInit {
  constructor(
    private readonly cronTrigger: CronTrigger,
    private readonly triggerRegistry: TriggerRegistryService,
  ) {}

  onModuleInit() {
    this.triggerRegistry.register(this.cronTrigger);
    console.log("[SchedulerModule] Registered trigger: scheduler:cron");
  }
}
