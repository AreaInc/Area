import { Module, OnModuleInit } from "@nestjs/common";
import { PublicWebhookTrigger } from "./triggers/public-webhook.trigger";
import { WorkflowsModule } from "../workflows/workflows.module";
import { TriggerRegistryService } from "../registries/trigger-registry.service";

@Module({
  imports: [WorkflowsModule],
  providers: [PublicWebhookTrigger],
  exports: [PublicWebhookTrigger],
})
export class WebhookModule implements OnModuleInit {
  constructor(
    private readonly publicWebhookTrigger: PublicWebhookTrigger,
    private readonly triggerRegistry: TriggerRegistryService,
  ) {}

  onModuleInit() {
    this.triggerRegistry.register(this.publicWebhookTrigger);
    console.log("[WebhookModule] Registered trigger: webhook:incoming-webhook");
  }
}
