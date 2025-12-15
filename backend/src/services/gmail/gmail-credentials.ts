import { google } from "googleapis";
import { BaseCredentials } from "../../common/base/base-credentials";
import { ServiceProvider, CredentialType } from "../../common/types/enums";

export interface GmailOAuth2Data {
  accessToken: string;
  refreshToken: string;
  tokenType?: string;
  expiresAt?: number;
  scope?: string;
}

export class GmailCredentials extends BaseCredentials {
  constructor(
    userId: string,
    name: string,
    data: GmailOAuth2Data,
    id?: string,
  ) {
    super(userId, ServiceProvider.GMAIL, CredentialType.OAUTH2, name, data, id);
  }

  async isValid(): Promise<boolean> {
    const data = this.data as GmailOAuth2Data;

    if (!data.accessToken) {
      return false;
    }

    if (data.expiresAt && data.expiresAt < Date.now()) {
      if (data.refreshToken) {
        try {
          await this.refresh();
          return true;
        } catch {
          return false;
        }
      }
      return false;
    }

    try {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
      );
      oauth2Client.setCredentials({
        access_token: data.accessToken,
        refresh_token: data.refreshToken,
        expiry_date: data.expiresAt,
      });

      const tokenInfo = await oauth2Client.getAccessToken();
      return !!tokenInfo.token;
    } catch {
      return false;
    }
  }

  async refresh(): Promise<void> {
    const data = this.data as GmailOAuth2Data;

    if (!data.refreshToken) {
      throw new Error("No refresh token available");
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );
    oauth2Client.setCredentials({
      access_token: data.accessToken,
      refresh_token: data.refreshToken,
      expiry_date: data.expiresAt,
    });

    const { credentials } = await oauth2Client.refreshAccessToken();

    this.data = {
      ...data,
      accessToken: credentials.access_token || data.accessToken,
      refreshToken: credentials.refresh_token || data.refreshToken,
      expiresAt: credentials.expiry_date || data.expiresAt,
      tokenType: credentials.token_type || data.tokenType,
    };
  }

  getAccessToken(): string {
    return (this.data as GmailOAuth2Data).accessToken;
  }

  getRefreshToken(): string | undefined {
    return (this.data as GmailOAuth2Data).refreshToken;
  }

  static fromJSON(json: Record<string, unknown>): GmailCredentials {
    let id: string | undefined;
    if (json.id !== undefined && json.id !== null) {
      if (typeof json.id === "string") {
        id = json.id;
      } else if (typeof json.id === "number") {
        id = String(json.id);
      }
    }
    return new GmailCredentials(
      String(json.userId),
      String(json.name),
      json.data as GmailOAuth2Data,
      id,
    );
  }
}
