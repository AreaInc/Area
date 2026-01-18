export interface YouTubeCredentials {
  data: {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
  };
  clientId?: string;
  clientSecret?: string;
}
