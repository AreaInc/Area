import { TwitchCredentials } from "./twitch-credentials";

export class TwitchClient {
  private accessToken: string;
  private refreshToken: string;
  private expiresAt: number;
  private clientId: string;
  private clientSecret: string;

  private readonly baseUrl = "https://api.twitch.tv/helix";

  constructor(credentials: TwitchCredentials) {
    this.accessToken = credentials.data.accessToken || "";
    this.refreshToken = credentials.data.refreshToken || "";
    this.expiresAt = credentials.data.expiresAt || 0;
    this.clientId = credentials.clientId || process.env.TWITCH_CLIENT_ID || "";
    this.clientSecret =
      credentials.clientSecret || process.env.TWITCH_CLIENT_SECRET || "";
  }

  private async refreshAccessToken() {
    if (!this.refreshToken || !this.clientId || !this.clientSecret) {
      throw new Error("Missing credentials for refresh");
    }

    const params = new URLSearchParams();
    params.append("client_id", this.clientId);
    params.append("client_secret", this.clientSecret);
    params.append("grant_type", "refresh_token");
    params.append("refresh_token", this.refreshToken);

    const response = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh token: ${await response.text()}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    if (data.refresh_token) this.refreshToken = data.refresh_token;
    this.expiresAt = Date.now() + data.expires_in * 1000;
  }

  private async ensureValidToken() {
    if (Date.now() >= this.expiresAt - 60000) {
      await this.refreshAccessToken();
    }
  }

  private async request(method: string, endpoint: string, body?: any) {
    await this.ensureValidToken();
    const url = `${this.baseUrl}${endpoint}`;
    const options: RequestInit = {
      method,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Client-Id": this.clientId,
        "Content-Type": "application/json",
      },
    };
    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    if (response.status === 204) return null;

    if (!response.ok) {
      let errorMsg = response.statusText;
      try {
        const errData = await response.json();
        errorMsg = JSON.stringify(errData);
      } catch {
        // ignore
      }
      throw new Error(`Twitch API Error ${response.status}: ${errorMsg}`);
    }
    return response.json();
  }

  async getUserInfo() {
    const data = await this.request("GET", "/users");
    return data.data[0];
  }

  async getStreamInfo(userId: string) {
    const data = await this.request("GET", `/streams?user_id=${userId}`);
    return data.data[0];
  }

  async getFollowers(broadcasterId: string) {
    const data = await this.request(
      "GET",
      `/channels/followers?broadcaster_id=${broadcasterId}`,
    );
    return data.data;
  }

  async updateChannelInfo(broadcasterId: string, data: any) {
    await this.request(
      "PATCH",
      `/channels?broadcaster_id=${broadcasterId}`,
      data,
    );
  }

  async getGameByName(name: string) {
    const encoded = encodeURIComponent(name);
    const data = await this.request("GET", `/games?name=${encoded}`);
    return data.data?.[0];
  }

  async sendChatMessage(
    broadcasterId: string,
    senderId: string,
    message: string,
  ) {
    await this.request("POST", "/chat/messages", {
      broadcaster_id: broadcasterId,
      sender_id: senderId,
      message,
    });
  }

  async createClip(broadcasterId: string, hasDelay: boolean = false) {
    const data = await this.request(
      "POST",
      `/clips?broadcaster_id=${broadcasterId}&has_delay=${hasDelay}`,
    );
    return data.data[0];
  }

  async startCommercial(broadcasterId: string, length: number) {
    const data = await this.request("POST", "/channels/commercial", {
      broadcaster_id: broadcasterId,
      length,
    });
    return data.data[0];
  }

  async createStreamMarker(userId: string, description: string) {
    const data = await this.request("POST", "/streams/markers", {
      user_id: userId,
      description,
    });
    return data.data[0];
  }
}
