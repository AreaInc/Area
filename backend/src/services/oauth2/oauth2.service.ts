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
  credentialId: number;
  redirectUrl?: string;
  timestamp: number;
}

@Injectable()
export class OAuth2Service {
  private stateStore = new Map<string, OAuthState>();

  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

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

    // TODO: Temporary hardcoded ngrok URL - replace with DEPLOY_ADDRESS when domain is ready
    const callbackUrl = "https://nonformal-antonette-slumberously.ngrok-free.dev/api/oauth2-credential/callback";

    const oauth2Client = new google.auth.OAuth2(
      credential.clientId,
      credential.clientSecret,
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

    // TODO: Temporary hardcoded ngrok URL - replace with DEPLOY_ADDRESS when domain is ready
    const callbackUrl = "https://nonformal-antonette-slumberously.ngrok-free.dev/api/oauth2-credential/callback";

    const oauth2Client = new google.auth.OAuth2(
      credential.clientId,
      credential.clientSecret,
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
        // TODO: Temporary hardcoded ngrok URL - replace with DEPLOY_ADDRESS when domain is ready
        const callbackUrl = "https://nonformal-antonette-slumberously.ngrok-free.dev/api/oauth2-credential/callback";
        
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
