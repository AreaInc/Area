import { SpotifyCredentials } from "./spotify-credentials";

export class SpotifyClient {
    private accessToken: string;
    private refreshToken: string;
    private expiresAt: number;
    private clientId: string;
    private clientSecret: string;

    private readonly baseUrl = "https://api.spotify.com/v1";

    constructor(credentials: SpotifyCredentials) {
        this.accessToken = credentials.data.accessToken || "";
        this.refreshToken = credentials.data.refreshToken || "";
        this.expiresAt = credentials.data.expiresAt || 0;
        this.clientId = credentials.clientId || process.env.SPOTIFY_CLIENT_ID || "";
        this.clientSecret = credentials.clientSecret || process.env.SPOTIFY_CLIENT_SECRET || "";
    }

    private async refreshAccessToken() {
        if (!this.refreshToken || !this.clientId || !this.clientSecret) {
            throw new Error("Missing credentials for refresh");
        }

        const params = new URLSearchParams();
        params.append('grant_type', 'refresh_token');
        params.append('refresh_token', this.refreshToken);

        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64'),
                'Content-Type': 'application/x-www-form-urlencoded',
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
        if (Date.now() >= this.expiresAt - 60000) { // Refresh if expiring in less than 1 min
            await this.refreshAccessToken();
        }
    }

    private async request(method: string, endpoint: string, body?: any) {
        await this.ensureValidToken();
        const url = `${this.baseUrl}${endpoint}`;
        const options: RequestInit = {
            method,
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json',
            },
        };
        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(url, options);
        // Spotify returns 204 for some actions
        if (response.status === 204) return null;

        if (!response.ok) {
            let errorMsg = response.statusText;
            try {
                const errData = await response.json();
                errorMsg = JSON.stringify(errData);
            } catch { }
            throw new Error(`Spotify API Error ${response.status}: ${errorMsg}`);
        }
        return response.json();
    }

    // --- Actions ---

    async getAvailableDevices() {
        const data = await this.request('GET', '/me/player/devices');
        return data.devices || [];
    }

    async playTrack(trackUri: string) {
        try {
            await this.request('PUT', '/me/player/play', { uris: [trackUri] });
        } catch (error: any) {
            // Check if error is NO_ACTIVE_DEVICE (404 for this specific reason usually, or just general failure)
            // Spotify API 404 text often contains "NO_ACTIVE_DEVICE" or "Player command failed: No active device found"
            const errorMessage = error.message || "";
            if (errorMessage.includes("NO_ACTIVE_DEVICE") || errorMessage.includes("No active device")) {
                console.log("No active device found, attempting to find available device...");
                const devices = await this.getAvailableDevices();
                if (devices.length > 0) {
                    // Pick the first one
                    const deviceId = devices[0].id;
                    console.log(`Activating device: ${devices[0].name} (${deviceId})`);
                    await this.request('PUT', `/me/player/play?device_id=${deviceId}`, { uris: [trackUri] });
                    return;
                } else {
                    throw new Error("No Spotify devices available. Please open Spotify on a device to allow playback.");
                }
            }
            throw error;
        }
    }

    async pausePlayback() {
        await this.request('PUT', '/me/player/pause');
    }

    async skipTrack() {
        await this.request('POST', '/me/player/next');
    }

    async likeTrack(trackId: string) {
        await this.request('PUT', '/me/tracks?ids=' + trackId);
    }

    async createPlaylist(userId: string, name: string, description: string = "") {
        return this.request('POST', `/users/${userId}/playlists`, {
            name,
            description,
            public: false
        });
    }

    async addTracksToPlaylist(playlistId: string, uris: string[]) {
        return this.request('POST', `/playlists/${playlistId}/tracks`, { uris });
    }

    // --- Search & Lookups ---

    async searchTrack(query: string): Promise<string> {
        const q = encodeURIComponent(query);
        const data = await this.request('GET', `/search?q=${q}&type=track&limit=1`);
        const tracks = data.tracks?.items;
        if (!tracks || tracks.length === 0) {
            throw new Error(`Track not found: ${query}`);
        }
        return tracks[0].uri;
    }

    async searchPlaylist(query: string): Promise<any> {
        const q = encodeURIComponent(query);
        const data = await this.request('GET', `/search?q=${q}&type=playlist&limit=1`);
        const playlists = data.playlists?.items;
        if (!playlists || playlists.length === 0) {
            throw new Error(`Playlist not found: ${query}`);
        }
        return playlists[0];
    }

    async getUserProfile() {
        return this.request('GET', '/me');
    }

    async getPlayerState() {
        return this.request('GET', '/me/player');
    }

    // --- Polling Helpers ---

    async getRecentlyPlayed(limit: number = 20) {
        return this.request('GET', `/me/player/recently-played?limit=${limit}`);
    }

    async getLikedTracks(limit: number = 20) {
        return this.request('GET', `/me/tracks?limit=${limit}`);
    }
}
