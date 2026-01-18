import {
  PlayMusicAction,
  AddToPlaylistAction,
  CreatePlaylistAction,
  SkipTrackAction,
  PausePlaybackAction,
  LikeCurrentTrackAction,
} from "./spotify-actions";
import { ServiceProvider } from "../../../common/types/enums";

describe("Spotify Actions", () => {
  it("PlayMusicAction metadata and validation", async () => {
    const action = new PlayMusicAction();
    expect(action.id).toBe("play_music");
    expect(action.serviceProvider).toBe(ServiceProvider.SPOTIFY);
    expect(await action.validateInput({ trackUri: "u" })).toBe(true);
    expect(await action.validateInput({})).toBe(false);
    expect(action.getMetadata().id).toBe(action.id);
  });

  it("AddToPlaylistAction metadata and validation", async () => {
    const action = new AddToPlaylistAction();
    expect(action.id).toBe("add_to_playlist");
    expect(await action.validateInput({ playlistId: "p", trackUri: "u" })).toBe(
      true,
    );
    expect(await action.validateInput({ playlistId: "p" })).toBe(false);
    expect(action.getMetadata().id).toBe(action.id);
  });

  it("CreatePlaylistAction metadata and validation", async () => {
    const action = new CreatePlaylistAction();
    expect(action.id).toBe("create_playlist");
    expect(await action.validateInput({ name: "n" })).toBe(true);
    expect(await action.validateInput({})).toBe(false);
    expect(action.getMetadata().id).toBe(action.id);
  });

  it("SkipTrackAction metadata", async () => {
    const action = new SkipTrackAction();
    expect(await action.validateInput({})).toBe(true);
    expect(action.getMetadata().id).toBe(action.id);
  });

  it("PausePlaybackAction metadata", async () => {
    const action = new PausePlaybackAction();
    expect(await action.validateInput({})).toBe(true);
    expect(action.getMetadata().id).toBe(action.id);
  });

  it("LikeCurrentTrackAction metadata", async () => {
    const action = new LikeCurrentTrackAction();
    expect(await action.validateInput({})).toBe(true);
    expect(action.getMetadata().id).toBe(action.id);
  });
});
