import { Module, OnModuleInit } from "@nestjs/common";
import { SendDiscordWebhookAction } from "./actions/send-webhook.action";
import { WorkflowsModule } from "../workflows/workflows.module";
import { ActionRegistryService } from "../registries/action-registry.service";

@Module({
  imports: [WorkflowsModule],
  providers: [SendDiscordWebhookAction],
  exports: [SendDiscordWebhookAction],
})
export class DiscordModule implements OnModuleInit {
  constructor(
    private readonly sendDiscordWebhookAction: SendDiscordWebhookAction,
    private readonly actionRegistry: ActionRegistryService,
  ) {}

  onModuleInit() {
    this.actionRegistry.register(this.sendDiscordWebhookAction);
    console.log("[DiscordModule] Registered action: discord:send-webhook");
  }
}
