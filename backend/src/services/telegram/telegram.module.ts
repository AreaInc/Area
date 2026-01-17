import { Module, OnModuleInit } from "@nestjs/common";
import { ActionRegistryService } from "../registries/action-registry.service";
import { WorkflowsModule } from "../workflows/workflows.module";
import { SendTelegramMessageAction } from "./actions/send-message.action";

@Module({
  imports: [WorkflowsModule],
  providers: [SendTelegramMessageAction],
  exports: [SendTelegramMessageAction],
})
export class TelegramModule implements OnModuleInit {
  constructor(
    private readonly sendTelegramMessageAction: SendTelegramMessageAction,
    private readonly actionRegistry: ActionRegistryService,
  ) { }

  onModuleInit() {
    this.actionRegistry.register(this.sendTelegramMessageAction);
    console.log(
      "[TelegramModule] Registered action: telegram:send-message",
    );
  }
}
