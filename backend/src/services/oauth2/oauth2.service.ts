import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Inject,
} from "@nestjs/common";
import { google } from "googleapis";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { DRIZZLE } from "../../db/drizzle.module";
import * as schema from "../../db/schema";
import { credentials } from "../../db/schema";
import { eq, and } from "drizzle-orm";
import * as crypto from "crypto";

interface OAuthState {
  userId: string;
  provider: string;
  redirectUrl?: string;
  timestamp: number;
}

@Injectable()
export class OAuth2Service {
  private stateStore = new Map<string, OAuthState>();

  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async getAuthUrl(
    provider: string,
    userId: string,
    redirectUrl?: string,
  ): Promise<{ authUrl: string; state: string }> {
    if (provider !== "gmail" && provider !== "google") {
      throw new BadRequestException("Unsupported OAuth2 provider");
    }

    const state = crypto.randomBytes(32).toString("hex");

    this.stateStore.set(state, {
      userId,
      provider,
      redirectUrl,
      timestamp: Date.now(),
    });

    this.cleanupOldStates();

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const callbackUrl =
      process.env.OAUTH_CALLBACK_URL ||
      "http://localhost:8080/api/oauth2-credential/callback";

    if (!clientId || !clientSecret) {
      throw new BadRequestException(
        "OAuth2 client credentials not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.",
      );
    }

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      callbackUrl,
    );

    const scopes = [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/gmail.modify",
      "https://www.googleapis.com/auth/userinfo.email",
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      state: state,
      prompt: "consent",
    });

    return { authUrl, state };
  }

  async handleCallback(
    code: string,
    state: string,
  ): Promise<{ success: boolean; credentialId?: number; error?: string }> {
    const stateData = this.stateStore.get(state);
    if (!stateData) {
      throw new UnauthorizedException("Invalid or expired state token");
    }

    this.stateStore.delete(state);

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const callbackUrl =
      process.env.OAUTH_CALLBACK_URL ||
      "http://localhost:8080/api/oauth2-credential/callback";

    if (!clientId || !clientSecret) {
      throw new BadRequestException("OAuth2 client credentials not configured");
    }

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      callbackUrl,
    );

    try {
      const { tokens } = await oauth2Client.getToken(code);

      if (!tokens.access_token || !tokens.refresh_token) {
        throw new BadRequestException(
          "Failed to obtain tokens from OAuth2 provider",
        );
      }

      oauth2Client.setCredentials(tokens);
      const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
      const userInfo = await oauth2.userinfo.get();

      const userEmail = userInfo.data.email || "Unknown";

      const expiresAt = tokens.expiry_date
        ? new Date(tokens.expiry_date)
        : null;

      const [credential] = await this.db
        .insert(credentials)
        .values({
          userId: stateData.userId,
          serviceProvider: stateData.provider === "gmail" ? "gmail" : "google",
          type: "oauth2",
          name: `${stateData.provider} - ${userEmail}`,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: expiresAt,
          scope: tokens.scope,
          clientId: clientId,
          clientSecret: clientSecret,
          isValid: true,
        })
        .returning();

      return {
        success: true,
        credentialId: credential.id,
      };
    } catch (error) {
      console.error("OAuth2 callback error:", error);
      return {
        success: false,
        error: error.message || "Failed to complete OAuth2 flow",
      };
    }
  }

  /**
   * Refresh an expired OAuth2 token
   */
  async refreshToken(credentialId: number): Promise<void> {
    const [credential] = await this.db
      .select()
      .from(credentials)
      .where(eq(credentials.id, credentialId));

    if (!credential) {
      throw new BadRequestException("Credential not found");
    }

    if (credential.type !== "oauth2") {
      throw new BadRequestException("Credential is not OAuth2 type");
    }

    if (
      !credential.refreshToken ||
      !credential.clientId ||
      !credential.clientSecret
    ) {
      throw new BadRequestException("Missing OAuth2 refresh credentials");
    }

    const oauth2Client = new google.auth.OAuth2(
      credential.clientId,
      credential.clientSecret,
    );

    oauth2Client.setCredentials({
      refresh_token: credential.refreshToken,
    });

    try {
      const { credentials: newTokens } =
        await oauth2Client.refreshAccessToken();

      const expiresAt = newTokens.expiry_date
        ? new Date(newTokens.expiry_date)
        : null;

      await this.db
        .update(credentials)
        .set({
          accessToken: newTokens.access_token,
          expiresAt: expiresAt,
          isValid: true,
          updatedAt: new Date(),
        })
        .where(eq(credentials.id, credentialId));
    } catch (error) {
      console.error("Failed to refresh token:", error);

      await this.db
        .update(credentials)
        .set({
          isValid: false,
          updatedAt: new Date(),
        })
        .where(eq(credentials.id, credentialId));

      throw new UnauthorizedException(
        "Failed to refresh OAuth2 token. Please re-authenticate.",
      );
    }
  }

  /**
   * Get OAuth2 credentials for a user and provider
   */
  async getCredentials(
    userId: string,
    provider: string,
    credentialId?: number,
  ) {
    const conditions = [
      eq(credentials.userId, userId),
      eq(credentials.serviceProvider, provider as any),
    ];

    if (credentialId) {
      conditions.push(eq(credentials.id, credentialId));
    }

    const [credential] = await this.db
      .select()
      .from(credentials)
      .where(and(...conditions));

    return credential;
  }

  async deleteCredentials(userId: string, credentialId: number): Promise<void> {
    await this.db
      .delete(credentials)
      .where(
        and(eq(credentials.id, credentialId), eq(credentials.userId, userId)),
      );
  }

  private cleanupOldStates(): void {
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;

    for (const [state, data] of this.stateStore.entries()) {
      if (data.timestamp < tenMinutesAgo) {
        this.stateStore.delete(state);
      }
    }
  }
}
