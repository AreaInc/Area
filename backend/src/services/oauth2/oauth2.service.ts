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
import { OAUTH_CONFIG } from "./oauth.constants";
import { ServiceProvider } from "../../common/types/enums";

interface OAuthState {
  userId: string;
  credentialId: number;
  redirectUrl?: string;
  timestamp: number;
}

@Injectable()
export class OAuth2Service {
  private stateStore = new Map<string, OAuthState>();

  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) { }

  private getCallbackUrl(): string {
    if (process.env.OAUTH_CALLBACK_URL) {
      return process.env.OAUTH_CALLBACK_URL;
    }

    if (process.env.DEPLOY_ADDRESS) {
      return `http://${process.env.DEPLOY_ADDRESS}:8080/api/oauth2-credential/callback`;
    }

    return "http://localhost:8080/api/oauth2-credential/callback";
  }

  async listCredentials(userId: string) {
    const userCredentials = await this.db
      .select()
      .from(credentials)
      .where(eq(credentials.userId, userId));

    return userCredentials.map((cred) => ({
      id: cred.id,
      name: cred.name,
      serviceProvider: cred.serviceProvider,
      credentialType: cred.type,
      isValid: cred.isValid,
      createdAt: cred.createdAt,
      updatedAt: cred.updatedAt,
    }));
  }

  async getCredential(userId: string, credentialId: number) {
    const [credential] = await this.db
      .select()
      .from(credentials)
      .where(
        and(eq(credentials.id, credentialId), eq(credentials.userId, userId)),
      );

    if (!credential) {
      throw new BadRequestException("Credential not found");
    }

    return {
      id: credential.id,
      name: credential.name,
      serviceProvider: credential.serviceProvider,
      credentialType: credential.type,
      isValid: credential.isValid,
      createdAt: credential.createdAt,
      updatedAt: credential.updatedAt,
    };
  }

  async createCredential(
    userId: string,
    dto: {
      name: string;
      provider: string;
      clientId: string;
      clientSecret: string;
    },
  ) {
    const [credential] = await this.db
      .insert(credentials)
      .values({
        userId,
        serviceProvider: dto.provider as any,
        type: "oauth2" as any,
        name: dto.name,
        clientId: dto.clientId,
        clientSecret: dto.clientSecret,
        isValid: false,
      })
      .returning();

    return {
      id: credential.id,
      name: credential.name,
      serviceProvider: credential.serviceProvider,
      credentialType: credential.type,
      isValid: credential.isValid,
      createdAt: credential.createdAt,
      updatedAt: credential.updatedAt,
    };
  }

  async getAuthUrl(
    userId: string,
    credentialId: number,
    redirectUrl?: string,
  ): Promise<{ authUrl: string; state: string }> {
    const [credential] = await this.db
      .select()
      .from(credentials)
      .where(
        and(eq(credentials.id, credentialId), eq(credentials.userId, userId)),
      );

    if (!credential) {
      throw new BadRequestException("Credential not found");
    }

    if (!credential.clientId || !credential.clientSecret) {
      throw new BadRequestException(
        "Credential does not have client ID and secret configured",
      );
    }

    const state = crypto.randomBytes(32).toString("hex");

    this.stateStore.set(state, {
      userId,
      credentialId,
      redirectUrl,
      timestamp: Date.now(),
    });

    this.cleanupOldStates();

    const callbackUrl = this.getCallbackUrl();
    const provider = credential.serviceProvider;

    if (this.isGoogleProvider(provider)) {
      const oauth2Client = new google.auth.OAuth2(
        credential.clientId,
        credential.clientSecret,
        callbackUrl,
      );

      const authUrl = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: OAUTH_CONFIG.google.scopes,
        state: state,
        prompt: "consent",
        include_granted_scopes: true,
      });

      return { authUrl, state };
    } else if (provider === ServiceProvider.SPOTIFY) {
      const params = new URLSearchParams({
        client_id: credential.clientId!,
        response_type: "code",
        redirect_uri: callbackUrl,
        scope: OAUTH_CONFIG.spotify.scopes.join(" "),
        state: state,
      });
      return {
        authUrl: `${OAUTH_CONFIG.spotify.authUrl}?${params.toString()}`,
        state,
      };
    } else if (provider === ServiceProvider.TWITCH) {
      const params = new URLSearchParams({
        client_id: credential.clientId!,
        response_type: "code",
        redirect_uri: callbackUrl,
        scope: OAUTH_CONFIG.twitch.scopes.join(" "),
        state: state,
      });
      return {
        authUrl: `${OAUTH_CONFIG.twitch.authUrl}?${params.toString()}`,
        state,
      };
    }

    throw new BadRequestException(`Unsupported provider: ${provider}`);


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

    const [credential] = await this.db
      .select()
      .from(credentials)
      .where(
        and(
          eq(credentials.id, stateData.credentialId),
          eq(credentials.userId, stateData.userId),
        ),
      );

    if (!credential) {
      throw new BadRequestException("Credential not found");
    }

    if (!credential.clientId || !credential.clientSecret) {
      throw new BadRequestException(
        "Credential does not have client ID and secret configured",
      );
    }

    const callbackUrl = this.getCallbackUrl();
    const provider = credential.serviceProvider;
    let tokens: any = {};
    let userEmail = "Unknown";

    try {
      if (this.isGoogleProvider(provider)) {
        const oauth2Client = new google.auth.OAuth2(
          credential.clientId,
          credential.clientSecret,
          callbackUrl,
        );
        const { tokens: googleTokens } = await oauth2Client.getToken(code);
        tokens = googleTokens;

        oauth2Client.setCredentials(tokens);
        const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
        const userInfo = await oauth2.userinfo.get();
        userEmail = userInfo.data.email || "Unknown";
      } else if (provider === ServiceProvider.SPOTIFY) {
        const body = new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: callbackUrl,
        });
        const auth = Buffer.from(
          `${credential.clientId}:${credential.clientSecret}`,
        ).toString("base64");
        const res = await fetch(OAUTH_CONFIG.spotify.tokenUrl, {
          method: "POST",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body,
        });
        const data = (await res.json()) as any;
        if (!res.ok)
          throw new Error(
            data.error_description || "Failed to get Spotify token",
          );

        tokens = {
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expiry_date: Date.now() + data.expires_in * 1000,
          scope: data.scope,
        };

        // Get Profile
        const profileRes = await fetch("https://api.spotify.com/v1/me", {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        });
        const profile = (await profileRes.json()) as any;
        userEmail = profile.email || profile.id;
      } else if (provider === ServiceProvider.TWITCH) {
        const body = new URLSearchParams({
          client_id: credential.clientId!,
          client_secret: credential.clientSecret!,
          code,
          grant_type: "authorization_code",
          redirect_uri: callbackUrl,
        });
        const res = await fetch(OAUTH_CONFIG.twitch.tokenUrl, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body,
        });
        const data = (await res.json()) as any;
        if (!res.ok)
          throw new Error(data.message || "Failed to get Twitch token");

        tokens = {
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expiry_date: Date.now() + data.expires_in * 1000,
          scope: Array.isArray(data.scope) ? data.scope.join(" ") : data.scope,
        };

        // Get Profile
        const profileRes = await fetch("https://api.twitch.tv/helix/users", {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
            "Client-Id": credential.clientId!,
          },
        });
        const profileData = (await profileRes.json()) as any;
        userEmail =
          profileData.data?.[0]?.email ||
          profileData.data?.[0]?.login ||
          "Twitch User";
      } else {
        throw new BadRequestException(`Unsupported provider: ${provider}`);
      }

      const expiresAt = tokens.expiry_date
        ? new Date(tokens.expiry_date)
        : null;

      await this.db
        .update(credentials)
        .set({
          name: `${credential.serviceProvider} - ${userEmail}`,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: expiresAt,
          scope: tokens.scope,
          isValid: true,
          updatedAt: new Date(),
        })
        .where(eq(credentials.id, stateData.credentialId));

      return {
        success: true,
        credentialId: stateData.credentialId,
      };
    } catch (error: any) {
      console.error("OAuth2 callback error:", error);

      // Check for redirect URI mismatch errors
      const errorMessage = error?.message || "";
      const errorCode = error?.code || "";

      if (
        errorMessage.includes("redirect_uri_mismatch") ||
        errorMessage.includes("invalid_request") ||
        errorCode === "invalid_request" ||
        errorMessage.includes("redirect_uri")
      ) {
        const callbackUrl = this.getCallbackUrl();

        return {
          success: false,
          error: `Redirect URI mismatch. Please ensure the following URL is added to your Google Cloud Console OAuth 2.0 Client ID settings under "Authorized redirect URIs": ${callbackUrl}. The URL must match exactly, including protocol (http/https) and port.`,
        };
      }

      return {
        success: false,
        error: errorMessage || "Failed to complete OAuth2 flow",
      };
    }
  }

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

    const provider = credential.serviceProvider;
    let newTokens: any = {};

    try {
      if (this.isGoogleProvider(provider)) {
        const oauth2Client = new google.auth.OAuth2(
          credential.clientId,
          credential.clientSecret,
        );

        oauth2Client.setCredentials({
          refresh_token: credential.refreshToken,
        });
        const { credentials: tokens } = await oauth2Client.refreshAccessToken();
        newTokens = {
          access_token: tokens.access_token,
          expires_at: tokens.expiry_date,
        };
      } else if (provider === ServiceProvider.SPOTIFY) {
        const body = new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: credential.refreshToken,
        });
        const auth = Buffer.from(
          `${credential.clientId}:${credential.clientSecret}`,
        ).toString("base64");
        const res = await fetch(OAUTH_CONFIG.spotify.tokenUrl, {
          method: "POST",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body,
        });
        const data = (await res.json()) as any;
        if (!res.ok)
          throw new Error(
            data.error_description || "Failed to refresh Spotify token",
          );
        newTokens = {
          access_token: data.access_token,
          expires_at: Date.now() + data.expires_in * 1000,
          refresh_token: data.refresh_token || credential.refreshToken,
        };
      } else if (provider === ServiceProvider.TWITCH) {
        const body = new URLSearchParams({
          client_id: credential.clientId!,
          client_secret: credential.clientSecret!,
          grant_type: "refresh_token",
          refresh_token: credential.refreshToken,
        });
        const res = await fetch(OAUTH_CONFIG.twitch.tokenUrl, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body,
        });
        const data = (await res.json()) as any;
        if (!res.ok)
          throw new Error(data.message || "Failed to refresh Twitch token");
        newTokens = {
          access_token: data.access_token,
          expires_at: Date.now() + data.expires_in * 1000,
          refresh_token: data.refresh_token || credential.refreshToken,
        };
      } else {
        throw new BadRequestException(
          `Unsupported provider for refresh: ${provider}`,
        );
      }

      await this.db
        .update(credentials)
        .set({
          accessToken: newTokens.access_token,
          refreshToken: newTokens.refresh_token || credential.refreshToken,
          expiresAt: newTokens.expires_at
            ? new Date(newTokens.expires_at)
            : null,
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

  private isGoogleProvider(provider: string): boolean {
    return [
      ServiceProvider.GOOGLE,
      ServiceProvider.GMAIL,
      ServiceProvider.GOOGLE_SHEETS,
      ServiceProvider.YOUTUBE,
    ].includes(provider as ServiceProvider);
  }
}
