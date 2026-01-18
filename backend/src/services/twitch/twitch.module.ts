import { Module, OnModuleInit } from "@nestjs/common";
import {
  UpdateStreamTitleAction,
  UpdateStreamGameAction,
  SendChatMessageAction,
  CreateClipAction,
  StartCommercialAction,
  CreateStreamMarkerAction,
} from "./actions/twitch-actions";
import {
  StreamStartedTrigger,
  StreamEndedTrigger,
  NewFollowerTrigger,
  ViewerCountThresholdTrigger,
} from "./triggers/twitch-triggers";
import { TwitchPollingService } from "./twitch-polling.service";
import { ActionRegistryService } from "../registries/action-registry.service";
import { TriggerRegistryService } from "../registries/trigger-registry.service";
import { WorkflowsModule } from "../workflows/workflows.module";

@Module({
  imports: [WorkflowsModule],
  providers: [
    UpdateStreamTitleAction,
    UpdateStreamGameAction,
    SendChatMessageAction,
    CreateClipAction,
    StartCommercialAction,
    CreateStreamMarkerAction,
    StreamStartedTrigger,
    StreamEndedTrigger,
    NewFollowerTrigger,
    ViewerCountThresholdTrigger,
    TwitchPollingService,
  ],
  exports: [
    UpdateStreamTitleAction,
    UpdateStreamGameAction,
    SendChatMessageAction,
    CreateClipAction,
    StartCommercialAction,
    CreateStreamMarkerAction,
    StreamStartedTrigger,
    StreamEndedTrigger,
    NewFollowerTrigger,
    ViewerCountThresholdTrigger,
    TwitchPollingService,
  ],
})
export class TwitchModule implements OnModuleInit {
  constructor(
    private readonly actionRegistry: ActionRegistryService,
    private readonly triggerRegistry: TriggerRegistryService,
    private readonly updateStreamTitleAction: UpdateStreamTitleAction,
    private readonly updateStreamGameAction: UpdateStreamGameAction,
    private readonly sendChatMessageAction: SendChatMessageAction,
    private readonly createClipAction: CreateClipAction,
    private readonly startCommercialAction: StartCommercialAction,
    private readonly createStreamMarkerAction: CreateStreamMarkerAction,
    private readonly streamStartedTrigger: StreamStartedTrigger,
    private readonly streamEndedTrigger: StreamEndedTrigger,
    private readonly newFollowerTrigger: NewFollowerTrigger,
    private readonly viewerCountTrigger: ViewerCountThresholdTrigger,
  ) {}

  onModuleInit() {
    this.actionRegistry.register(this.updateStreamTitleAction);
    this.actionRegistry.register(this.updateStreamGameAction);
    this.actionRegistry.register(this.sendChatMessageAction);
    this.actionRegistry.register(this.createClipAction);
    this.actionRegistry.register(this.startCommercialAction);
    this.actionRegistry.register(this.createStreamMarkerAction);

    this.triggerRegistry.register(this.streamStartedTrigger);
    this.triggerRegistry.register(this.streamEndedTrigger);
    this.triggerRegistry.register(this.newFollowerTrigger);
    this.triggerRegistry.register(this.viewerCountTrigger);
  }
}
