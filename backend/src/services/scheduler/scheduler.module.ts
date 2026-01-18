import { Module, OnModuleInit } from "@nestjs/common";
import { CronTrigger } from "./triggers/cron.trigger";
import { OnActivationTrigger } from "./triggers/on-activation.trigger";
import { WorkflowsModule } from "../workflows/workflows.module";
import { TriggerRegistryService } from "../registries/trigger-registry.service";

@Module({
  imports: [WorkflowsModule],
  providers: [CronTrigger, OnActivationTrigger],
  exports: [CronTrigger, OnActivationTrigger],
})
export class SchedulerModule implements OnModuleInit {
  constructor(
    private readonly cronTrigger: CronTrigger,
    private readonly onActivationTrigger: OnActivationTrigger,
    private readonly triggerRegistry: TriggerRegistryService,
  ) {}

  onModuleInit() {
    this.triggerRegistry.register(this.cronTrigger);
    this.triggerRegistry.register(this.onActivationTrigger);
    console.log(
      "[SchedulerModule] Registered triggers: scheduler:cron, scheduler:on-activation",
    );
  }
}
