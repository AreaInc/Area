import { Module, OnModuleInit } from "@nestjs/common";
import { ActionRegistryService } from "../registries/action-registry.service";
import { SendTelegramMessageAction } from "./actions/send-message.action";

@Module({
  providers: [SendTelegramMessageAction],
  exports: [SendTelegramMessageAction],
})
export class TelegramModule implements OnModuleInit {
  constructor(
    private readonly sendTelegramMessageAction: SendTelegramMessageAction,
    private readonly actionRegistry: ActionRegistryService,
  ) {}

  onModuleInit() {
    this.actionRegistry.register(this.sendTelegramMessageAction);
    console.log(
      "[TelegramModule] Registered action: telegram:send-message",
    );
  }
}
