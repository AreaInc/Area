export interface TwitchCredentials {
  data: {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
  };
  clientId?: string;
  clientSecret?: string;
}
