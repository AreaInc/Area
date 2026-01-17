export interface SpotifyCredentials {
    data: {
        accessToken?: string;
        refreshToken?: string;
        expiresAt?: number;
    };
    clientId?: string; // stored in env usually but interface allows overriding
    clientSecret?: string;
}
