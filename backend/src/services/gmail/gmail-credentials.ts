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
      return false;
    }

    return true;
  }

  async refresh(): Promise<void> {
    const data = this.data as GmailOAuth2Data;

    if (!data.refreshToken) {
      throw new Error("No refresh token available");
    }

    throw new Error("Token refresh not yet implemented");
  }

  getAccessToken(): string {
    return (this.data as GmailOAuth2Data).accessToken;
  }

  getRefreshToken(): string | undefined {
    return (this.data as GmailOAuth2Data).refreshToken;
  }

  static fromJSON(json: Record<string, any>): GmailCredentials {
    return new GmailCredentials(json.userId, json.name, json.data, json.id);
  }
}
