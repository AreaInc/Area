import { SpotifyClient } from "./spotify-client";

describe("SpotifyClient", () => {
  let client: SpotifyClient;
  const mockCreds = {
    clientId: "cid",
    clientSecret: "cs",
    data: {
      accessToken: "at",
      refreshToken: "rt",
      expiresAt: Date.now() + 3600000, // 1h in future
    },
  };

  beforeEach(() => {
    global.fetch = jest.fn();
    client = new SpotifyClient(mockCreds as any);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("Constructor", () => {
    it("should use environment variables as fallback", () => {
      process.env.SPOTIFY_CLIENT_ID = "env_id";
      process.env.SPOTIFY_CLIENT_SECRET = "env_secret";
      const c = new SpotifyClient({ data: {} } as any);
      expect((c as any).clientId).toBe("env_id");
      expect((c as any).clientSecret).toBe("env_secret");
    });
  });

  describe("refreshAccessToken", () => {
    it("should throw if missing credentials", async () => {
      const c = new SpotifyClient({ data: {} } as any);
      await expect((c as any).refreshAccessToken()).rejects.toThrow(
        "Missing credentials for refresh",
      );
    });

    it("should refresh successfully", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          access_token: "new_at",
          refresh_token: "new_rt",
          expires_in: 3600,
        }),
      });

      await (client as any).refreshAccessToken();

      expect(global.fetch).toHaveBeenCalledWith(
        "https://accounts.spotify.com/api/token",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("refresh_token=rt"),
        }),
      );
      expect((client as any).accessToken).toBe("new_at");
      expect((client as any).refreshToken).toBe("new_rt");
    });

    it("should throw if refresh fails", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        text: async () => "Invalid grant",
      });
      await expect((client as any).refreshAccessToken()).rejects.toThrow(
        "Failed to refresh token: Invalid grant",
      );
    });
  });

  describe("ensureValidToken", () => {
    it("should refresh if expiring within 1 minute", async () => {
      (client as any).expiresAt = Date.now() + 30000; // 30s
      const spy = jest
        .spyOn(client as any, "refreshAccessToken")
        .mockResolvedValue(undefined);
      await (client as any).ensureValidToken();
      expect(spy).toHaveBeenCalled();
    });

    it("should not refresh if still valid", async () => {
      (client as any).expiresAt = Date.now() + 120000; // 2min
      const spy = jest.spyOn(client as any, "refreshAccessToken");
      await (client as any).ensureValidToken();
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe("request", () => {
    it("should handle 204 response", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 204,
      });
      const res = await (client as any).request("GET", "/test");
      expect(res).toBeNull();
    });

    it("should handle JSON and non-JSON responses", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ ok: true }),
      });
      expect(await (client as any).request("GET", "/test")).toEqual({
        ok: true,
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: async () => "Plain text",
      });
      expect(await (client as any).request("GET", "/test")).toBe("Plain text");
    });

    it("should throw on API error", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        text: async () => JSON.stringify({ error: "msg" }),
      });
      await expect((client as any).request("GET", "/test")).rejects.toThrow(
        "Spotify API Error 401",
      );
    });

    it("should throw on API error with plain text", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        text: async () => "Ouch",
      });
      await expect((client as any).request("GET", "/test")).rejects.toThrow(
        "Ouch",
      );
    });
  });

  describe("Actions", () => {
    it("playTrack should handle NO_ACTIVE_DEVICE and retry", async () => {
      // First attempt fails with NO_ACTIVE_DEVICE
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          text: async () => "NO_ACTIVE_DEVICE",
        })
        .mockResolvedValueOnce({
          // getAvailableDevices
          ok: true,
          text: async () =>
            JSON.stringify({ devices: [{ id: "d1", name: "D1" }] }),
        })
        .mockResolvedValueOnce({
          // Second play attempt
          ok: true,
          status: 204,
        });

      await client.playTrack("uri");
      expect(global.fetch).toHaveBeenCalledTimes(3);
      expect(global.fetch).toHaveBeenLastCalledWith(
        expect.stringContaining("device_id=d1"),
        expect.anything(),
      );
    });

    it("playTrack should throw if no devices available", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          text: async () => "NO_ACTIVE_DEVICE",
        })
        .mockResolvedValueOnce({
          ok: true,
          text: async () => JSON.stringify({ devices: [] }),
        });

      await expect(client.playTrack("uri")).rejects.toThrow(
        "No Spotify devices available",
      );
    });

    it("playTrack should throw other errors", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => "Fail",
      });
      await expect(client.playTrack("uri")).rejects.toThrow("Fail");
    });

    it("should call various endpoints", async () => {
      const mockRequest = jest
        .spyOn(client as any, "request")
        .mockResolvedValue({
          devices: [],
          tracks: { items: [{ uri: "u" }] },
          playlists: { items: [{ id: "p" }] },
        });

      await client.getAvailableDevices();
      expect(mockRequest).toHaveBeenCalledWith("GET", "/me/player/devices");

      await client.pausePlayback();
      expect(mockRequest).toHaveBeenCalledWith("PUT", "/me/player/pause");

      await client.skipTrack();
      expect(mockRequest).toHaveBeenCalledWith("POST", "/me/player/next");

      await client.likeTrack("t1");
      expect(mockRequest).toHaveBeenCalledWith("PUT", "/me/tracks?ids=t1");

      await client.createPlaylist("u1", "n", "d");
      expect(mockRequest).toHaveBeenCalledWith(
        "POST",
        "/users/u1/playlists",
        expect.anything(),
      );

      await client.addTracksToPlaylist("p1", ["u1"]);
      expect(mockRequest).toHaveBeenCalledWith("POST", "/playlists/p1/tracks", {
        uris: ["u1"],
      });

      await client.searchTrack("query");
      expect(mockRequest).toHaveBeenCalledWith(
        "GET",
        expect.stringContaining("/search?q=query"),
      );

      await client.searchPlaylist("query");
      expect(mockRequest).toHaveBeenCalledWith(
        "GET",
        expect.stringContaining("/search?q=query"),
      );

      await client.getUserProfile();
      expect(mockRequest).toHaveBeenCalledWith("GET", "/me");

      await client.getPlayerState();
      expect(mockRequest).toHaveBeenCalledWith("GET", "/me/player");

      await client.getRecentlyPlayed(5);
      expect(mockRequest).toHaveBeenCalledWith(
        "GET",
        "/me/player/recently-played?limit=5",
      );

      await client.getLikedTracks(5);
      expect(mockRequest).toHaveBeenCalledWith("GET", "/me/tracks?limit=5");
    });

    it("searchTrack should throw if not found", async () => {
      jest
        .spyOn(client as any, "request")
        .mockResolvedValue({ tracks: { items: [] } });
      await expect(client.searchTrack("q")).rejects.toThrow("Track not found");
    });

    it("searchPlaylist should throw if not found", async () => {
      jest
        .spyOn(client as any, "request")
        .mockResolvedValue({ playlists: { items: [] } });
      await expect(client.searchPlaylist("q")).rejects.toThrow(
        "Playlist not found",
      );
    });
  });
});
