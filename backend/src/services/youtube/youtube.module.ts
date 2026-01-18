import { Module, OnModuleInit } from "@nestjs/common";
import {
  CreatePlaylistAction,
  DeletePlaylistAction,
  RateVideoAction,
  SubscribeChannelAction,
  UnsubscribeChannelAction,
  CommentVideoAction,
} from "./actions/youtube-actions";
import {
  NewLikedVideoTrigger,
  NewVideoFromChannelTrigger,
} from "./triggers/youtube-triggers";
import { YouTubePollingService } from "./youtube-polling.service";
import { ActionRegistryService } from "../registries/action-registry.service";
import { TriggerRegistryService } from "../registries/trigger-registry.service";
import { WorkflowsModule } from "../workflows/workflows.module";

@Module({
  imports: [WorkflowsModule],
  providers: [
    CreatePlaylistAction,
    DeletePlaylistAction,
    RateVideoAction,
    SubscribeChannelAction,
    UnsubscribeChannelAction,
    CommentVideoAction,
    NewLikedVideoTrigger,
    NewVideoFromChannelTrigger,
    YouTubePollingService,
  ],
  exports: [
    CreatePlaylistAction,
    DeletePlaylistAction,
    RateVideoAction,
    SubscribeChannelAction,
    UnsubscribeChannelAction,
    CommentVideoAction,
    NewLikedVideoTrigger,
    NewVideoFromChannelTrigger,
    YouTubePollingService,
  ],
})
export class YouTubeModule implements OnModuleInit {
  constructor(
    private readonly actionRegistry: ActionRegistryService,
    private readonly triggerRegistry: TriggerRegistryService,
    private readonly createPlaylist: CreatePlaylistAction,
    private readonly deletePlaylist: DeletePlaylistAction,
    private readonly rateVideo: RateVideoAction,
    private readonly subscribeChannel: SubscribeChannelAction,
    private readonly unsubscribeChannel: UnsubscribeChannelAction,
    private readonly commentVideo: CommentVideoAction,
    private readonly newLikedVideo: NewLikedVideoTrigger,
    private readonly newVideoFromChannel: NewVideoFromChannelTrigger,
  ) {}

  onModuleInit() {
    this.actionRegistry.register(this.createPlaylist);
    this.actionRegistry.register(this.deletePlaylist);
    this.actionRegistry.register(this.rateVideo);
    this.actionRegistry.register(this.subscribeChannel);
    this.actionRegistry.register(this.unsubscribeChannel);
    this.actionRegistry.register(this.commentVideo);

    this.triggerRegistry.register(this.newLikedVideo);
    this.triggerRegistry.register(this.newVideoFromChannel);
  }
}
