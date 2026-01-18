import { Module, OnModuleInit } from "@nestjs/common";
import {
  PlayMusicAction,
  AddToPlaylistAction,
  CreatePlaylistAction,
  SkipTrackAction,
  PausePlaybackAction,
  LikeCurrentTrackAction,
} from "./actions/spotify-actions";
import {
  NewTrackPlayedTrigger,
  NewLikedSongTrigger,
} from "./triggers/spotify-triggers";
import { SpotifyPollingService } from "./spotify-polling.service";
import { ActionRegistryService } from "../registries/action-registry.service";
import { TriggerRegistryService } from "../registries/trigger-registry.service";
import { WorkflowsModule } from "../workflows/workflows.module";

@Module({
  imports: [WorkflowsModule],
  providers: [
    // Actions
    PlayMusicAction,
    AddToPlaylistAction,
    CreatePlaylistAction,
    SkipTrackAction,
    PausePlaybackAction,
    LikeCurrentTrackAction,
    // Triggers
    NewTrackPlayedTrigger,
    NewLikedSongTrigger,
    // Service
    SpotifyPollingService,
  ],
  exports: [
    PlayMusicAction,
    AddToPlaylistAction,
    CreatePlaylistAction,
    SkipTrackAction,
    PausePlaybackAction,
    LikeCurrentTrackAction,
    NewTrackPlayedTrigger,
    NewLikedSongTrigger,
    SpotifyPollingService,
  ],
})
export class SpotifyModule implements OnModuleInit {
  constructor(
    private readonly actionRegistry: ActionRegistryService,
    private readonly triggerRegistry: TriggerRegistryService,
    private readonly playMusicAction: PlayMusicAction,
    private readonly addToPlaylistAction: AddToPlaylistAction,
    private readonly createPlaylistAction: CreatePlaylistAction,
    private readonly skipTrackAction: SkipTrackAction,
    private readonly pausePlaybackAction: PausePlaybackAction,
    private readonly likeCurrentTrackAction: LikeCurrentTrackAction,
    private readonly newTrackPlayedTrigger: NewTrackPlayedTrigger,
    private readonly newLikedSongTrigger: NewLikedSongTrigger,
  ) {}

  onModuleInit() {
    console.log("[SpotifyModule] Registering Spotify actions and triggers...");
    // Register Actions
    this.actionRegistry.register(this.playMusicAction);
    this.actionRegistry.register(this.addToPlaylistAction);
    this.actionRegistry.register(this.createPlaylistAction);
    this.actionRegistry.register(this.skipTrackAction);
    this.actionRegistry.register(this.pausePlaybackAction);
    this.actionRegistry.register(this.likeCurrentTrackAction);

    // Register Triggers
    this.triggerRegistry.register(this.newTrackPlayedTrigger);
    this.triggerRegistry.register(this.newLikedSongTrigger);

    console.log("[SpotifyModule] Spotify module initialized successfully");
  }
}
