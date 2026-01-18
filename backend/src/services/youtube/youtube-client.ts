import { google } from "googleapis";
import { YouTubeCredentials } from "./youtube-credentials";

export class YouTubeClient {
  private oauth2Client;
  private youtube;

  constructor(credentials: YouTubeCredentials) {
    const clientId = credentials.clientId || process.env.GOOGLE_CLIENT_ID;
    const clientSecret =
      credentials.clientSecret || process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("Missing Google Client ID/Secret");
    }

    this.oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    this.oauth2Client.setCredentials({
      access_token: credentials.data.accessToken,
      refresh_token: credentials.data.refreshToken,
      expiry_date: credentials.data.expiresAt,
    });

    this.youtube = google.youtube({ version: "v3", auth: this.oauth2Client });
  }

  // --- Actions ---

  async createPlaylist(title: string, description: string = "") {
    const res = await this.youtube.playlists.insert({
      part: ["snippet", "status"],
      requestBody: {
        snippet: { title, description },
        status: { privacyStatus: "private" },
      },
    });
    return res.data;
  }

  async deletePlaylist(playlistId: string) {
    await this.youtube.playlists.delete({ id: playlistId });
  }

  async rateVideo(videoId: string, rating: "like" | "dislike" | "none") {
    await this.youtube.videos.rate({ id: videoId, rating });
  }

  async subscribe(channelId: string) {
    await this.youtube.subscriptions.insert({
      part: ["snippet"],
      requestBody: {
        snippet: {
          resourceId: { kind: "youtube#channel", channelId },
        },
      },
    });
  }

  async unsubscribe(subscriptionId: string) {
    await this.youtube.subscriptions.delete({ id: subscriptionId });
  }

  async commentVideo(videoId: string, textOriginal: string) {
    await this.youtube.commentThreads.insert({
      part: ["snippet"],
      requestBody: {
        snippet: {
          videoId,
          topLevelComment: {
            snippet: { textOriginal },
          },
        },
      },
    });
  }

  // --- Lookups ---

  async searchChannel(query: string) {
    const res = await this.youtube.search.list({
      part: ["snippet"],
      q: query,
      type: ["channel"],
      maxResults: 1,
    });
    const item = res.data.items?.[0];
    if (!item) throw new Error(`Channel not found: ${query}`);
    return item;
  }

  async searchVideo(query: string) {
    const res = await this.youtube.search.list({
      part: ["snippet"],
      q: query,
      type: ["video"],
      maxResults: 1,
    });
    const item = res.data.items?.[0];
    if (!item) throw new Error(`Video not found: ${query}`);
    return item;
  }

  async findPlaylist(title: string) {
    const res = await this.youtube.playlists.list({
      part: ["snippet"],
      mine: true,
      maxResults: 50,
    });
    const playlist = res.data.items?.find((p) => p.snippet?.title === title);
    if (!playlist) throw new Error(`Playlist not found: ${title}`);
    return playlist;
  }

  async findSubscription(channelId: string) {
    const res = await this.youtube.subscriptions.list({
      part: ["id", "snippet"],
      mine: true,
      forChannelId: channelId,
    });
    return res.data.items?.[0];
  }

  // --- Polling Helpers ---

  async getLikedVideos(limit = 20) {
    // My Liked Videos playlist ID is usually "LL" but api might require fetching channels->relatedPlaylists->likes
    // But typically "LL" works or we search.
    // Actually modern API v3 might not support "LL" directly in playlistItems but let's try or use `videos.list({myRating='like'})`.
    // `videos.list` with `myRating='like'` is the standard way.
    const res = await this.youtube.videos.list({
      part: ["snippet", "contentDetails"],
      myRating: "like",
      maxResults: limit,
    });
    return res.data.items || [];
  }

  async getLatestUploads(channelId: string) {
    // Get uploads playlist ID
    const chReq = await this.youtube.channels.list({
      part: ["contentDetails"],
      id: [channelId],
    });
    const uploadsId =
      chReq.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsId) throw new Error("Could not find uploads playlist");

    const res = await this.youtube.playlistItems.list({
      part: ["snippet", "contentDetails"],
      playlistId: uploadsId,
      maxResults: 10,
    });
    return res.data.items || [];
  }
}
