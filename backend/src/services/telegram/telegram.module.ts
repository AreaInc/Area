import { Module, OnModuleInit } from "@nestjs/common";
import { ActionRegistryService } from "../registries/action-registry.service";
import { TriggerRegistryService } from "../registries/trigger-registry.service";
import { WorkflowsModule } from "../workflows/workflows.module";
import { SendTelegramMessageAction } from "./actions/send-message.action";
import { SendPhotoAction } from "./actions/send-photo.action";
import { PinMessageAction } from "./actions/pin-message.action";
import { KickMemberAction } from "./actions/kick-member.action";
import { UnbanMemberAction } from "./actions/unban-member.action";

import { OnMessageTrigger } from "./triggers/on-message.trigger";
import { OnCommandTrigger } from "./triggers/on-command.trigger";
import { OnPinnedMessageTrigger } from "./triggers/on-pinned-message.trigger";
import { OnNewMemberTrigger } from "./triggers/on-new-member.trigger";
import { OnReplyMessageTrigger } from "./triggers/on-reply-message.trigger";
import { OnVoiceMessageTrigger } from "./triggers/on-voice-message.trigger";
import { OnVideoMessageTrigger } from "./triggers/on-video-message.trigger";
import { OnStartDmTrigger } from "./triggers/on-start-dm.trigger";
import { OnMessageEditedTrigger } from "./triggers/on-message-edited.trigger";

import { TelegramPollingService } from "./telegram-polling.service";

@Module({
  imports: [WorkflowsModule],
  providers: [
    SendTelegramMessageAction,
    SendPhotoAction,
    PinMessageAction,
    KickMemberAction,
    UnbanMemberAction,

    OnMessageTrigger,
    OnCommandTrigger,
    OnPinnedMessageTrigger,
    OnNewMemberTrigger,
    OnReplyMessageTrigger,
    OnVoiceMessageTrigger,
    OnVideoMessageTrigger,
    OnStartDmTrigger,
    OnMessageEditedTrigger,

    TelegramPollingService,
  ],
  exports: [
    SendTelegramMessageAction,
    SendPhotoAction,
    PinMessageAction,
    KickMemberAction,
    UnbanMemberAction,
  ],
})
export class TelegramModule implements OnModuleInit {
  constructor(
    private readonly actionRegistry: ActionRegistryService,
    private readonly triggerRegistry: TriggerRegistryService,

    private readonly sendTelegramMessageAction: SendTelegramMessageAction,
    private readonly sendPhotoAction: SendPhotoAction,
    private readonly pinMessageAction: PinMessageAction,
    private readonly kickMemberAction: KickMemberAction,
    private readonly unbanMemberAction: UnbanMemberAction,

    private readonly onMessageTrigger: OnMessageTrigger,
    private readonly onCommandTrigger: OnCommandTrigger,
    private readonly onPinnedMessageTrigger: OnPinnedMessageTrigger,
    private readonly onNewMemberTrigger: OnNewMemberTrigger,
    private readonly onReplyMessageTrigger: OnReplyMessageTrigger,
    private readonly onVoiceMessageTrigger: OnVoiceMessageTrigger,
    private readonly onVideoMessageTrigger: OnVideoMessageTrigger,
    private readonly onStartDmTrigger: OnStartDmTrigger,
    private readonly onMessageEditedTrigger: OnMessageEditedTrigger,
  ) {}

  onModuleInit() {
    // Actions
    this.actionRegistry.register(this.sendTelegramMessageAction);
    this.actionRegistry.register(this.sendPhotoAction);
    this.actionRegistry.register(this.pinMessageAction);
    this.actionRegistry.register(this.kickMemberAction);
    this.actionRegistry.register(this.unbanMemberAction);

    // Triggers
    this.triggerRegistry.register(this.onMessageTrigger);
    this.triggerRegistry.register(this.onCommandTrigger);
    this.triggerRegistry.register(this.onPinnedMessageTrigger);
    this.triggerRegistry.register(this.onNewMemberTrigger);
    this.triggerRegistry.register(this.onReplyMessageTrigger);
    this.triggerRegistry.register(this.onVoiceMessageTrigger);
    this.triggerRegistry.register(this.onVideoMessageTrigger);
    this.triggerRegistry.register(this.onStartDmTrigger);
    this.triggerRegistry.register(this.onMessageEditedTrigger);

    console.log("[TelegramModule] Registered Telegram features");
  }
}
