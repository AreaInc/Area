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

  isValid(): Promise<boolean> {
    const data = this.data as GmailOAuth2Data;

    if (!data.accessToken) {
      return Promise.resolve(false);
    }

    if (data.expiresAt && data.expiresAt < Date.now()) {
      return Promise.resolve(false);
    }

    return Promise.resolve(true);
  }

  refresh(): Promise<void> {
    const data = this.data as GmailOAuth2Data;

    if (!data.refreshToken) {
      return Promise.reject(new Error("No refresh token available"));
    }

    return Promise.reject(new Error("Token refresh not yet implemented"));
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
