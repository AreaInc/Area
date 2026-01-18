import { SpotifyClient } from "./spotify-client";

const mockDb = {
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
};

const mockSpotifyClient = {
  playTrack: jest.fn(),
  addTracksToPlaylist: jest.fn(),
  getUserProfile: jest.fn(),
  createPlaylist: jest.fn(),
  skipTrack: jest.fn(),
  pausePlayback: jest.fn(),
  getPlayerState: jest.fn(),
  likeTrack: jest.fn(),
};

jest.mock("postgres", () => jest.fn(() => ({})));
jest.mock("drizzle-orm/postgres-js", () => ({
  drizzle: jest.fn(() => mockDb),
}));

jest.mock("./spotify-client", () => ({
  SpotifyClient: jest.fn(() => mockSpotifyClient),
}));

// Now import activities
import * as activities from "./spotify.activities";

describe("Spotify Activities", () => {
  const mockCred = {
    id: 10,
    userId: "u1",
    clientId: "cid",
    clientSecret: "cs",
    accessToken: "at",
    refreshToken: "rt",
    expiresAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb.select.mockReturnValue({
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockResolvedValue([mockCred]),
    });
    // Ensure mockSpotifyClient methods start fresh
    Object.values(mockSpotifyClient).forEach((m) => m.mockReset());
    // Also re-resolve defaults for methods that return something
    mockSpotifyClient.getUserProfile.mockResolvedValue({ id: "me" });
    mockSpotifyClient.getPlayerState.mockResolvedValue({
      item: { id: "t1", name: "T1" },
    });
    mockSpotifyClient.createPlaylist.mockResolvedValue({
      id: "new_p",
      external_urls: { spotify: "url" },
    });
  });

  describe("playMusicActivity", () => {
    it("should play a track", async () => {
      const input = { trackUri: "t1", credentialId: 10, userId: "u1" };
      await activities.playMusicActivity(input);
      expect(mockSpotifyClient.playTrack).toHaveBeenCalledWith(
        "spotify:track:t1",
      );
    });

    it("should throw if trackUri missing", async () => {
      await expect(
        activities.playMusicActivity({
          trackUri: "",
          credentialId: 10,
          userId: "u1",
        }),
      ).rejects.toThrow("Track URI is required");
    });
  });

  describe("addToPlaylistActivity", () => {
    it("should add track to playlist", async () => {
      const input = {
        playlistId: "p1",
        trackUri: "t1",
        credentialId: 10,
        userId: "u1",
      };
      await activities.addToPlaylistActivity(input);
      expect(mockSpotifyClient.addTracksToPlaylist).toHaveBeenCalledWith("p1", [
        "spotify:track:t1",
      ]);
    });

    it("should strip playlist URI prefix", async () => {
      const input = {
        playlistId: "spotify:playlist:p1",
        trackUri: "t1",
        credentialId: 10,
        userId: "u1",
      };
      await activities.addToPlaylistActivity(input);
      expect(mockSpotifyClient.addTracksToPlaylist).toHaveBeenCalledWith(
        "p1",
        expect.anything(),
      );
    });
  });

  describe("createSpotifyPlaylistActivity", () => {
    it("should create a playlist", async () => {
      const input = { name: "playlist", credentialId: 10, userId: "u1" };
      const res = await activities.createSpotifyPlaylistActivity(input);
      expect(res.playlistId).toBe("new_p");
      expect(mockSpotifyClient.createPlaylist).toHaveBeenCalledWith(
        "me",
        "playlist",
        undefined,
      );
    });
  });

  describe("skipTrackActivity", () => {
    it("should skip track", async () => {
      await activities.skipTrackActivity({ credentialId: 10, userId: "u1" });
      expect(mockSpotifyClient.skipTrack).toHaveBeenCalled();
    });
  });

  describe("pausePlaybackActivity", () => {
    it("should pause playback", async () => {
      await activities.pausePlaybackActivity({
        credentialId: 10,
        userId: "u1",
      });
      expect(mockSpotifyClient.pausePlayback).toHaveBeenCalled();
    });
  });

  describe("likeCurrentTrackActivity", () => {
    it("should like current track", async () => {
      const res = await activities.likeCurrentTrackActivity({
        credentialId: 10,
        userId: "u1",
      });
      expect(res.success).toBe(true);
      expect(mockSpotifyClient.likeTrack).toHaveBeenCalledWith("t1");
    });

    it("should throw if no track playing", async () => {
      mockSpotifyClient.getPlayerState.mockResolvedValue(null);
      await expect(
        activities.likeCurrentTrackActivity({ credentialId: 10, userId: "u1" }),
      ).rejects.toThrow("No track currently playing");
    });
  });

  describe("loadCredentials Helpers", () => {
    it("should throw if credentials not found", async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      });
      await expect(
        activities.playMusicActivity({
          trackUri: "u",
          credentialId: 1,
          userId: "u1",
        }),
      ).rejects.toThrow("Credentials not found");
    });

    it("should throw if unauthorized", async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ userId: "other" }]),
      });
      await expect(
        activities.playMusicActivity({
          trackUri: "u",
          credentialId: 1,
          userId: "u1",
        }),
      ).rejects.toThrow("Unauthorized");
    });
  });
});
