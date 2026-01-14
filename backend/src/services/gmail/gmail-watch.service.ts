import { Injectable, Inject, BadRequestException } from "@nestjs/common";
import { google } from "googleapis";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { DRIZZLE } from "../../db/drizzle.module";
import * as schema from "../../db/schema";
import { credentials, workflows } from "../../db/schema";
import { eq, and } from "drizzle-orm";

interface GmailWatchResponse {
  historyId: string;
  expiration: string; // Unix timestamp in milliseconds
}

@Injectable()
export class GmailWatchService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  /**
   * Sets up a Gmail Push API watch for a user's mailbox
   * Requires:
   * - Gmail API enabled
   * - Pub/Sub topic configured in Google Cloud
   * - Environment variable GMAIL_PUB_SUB_TOPIC set
   */
  async setupWatch(
    credentialId: number,
    labelIds?: string[],
  ): Promise<GmailWatchResponse> {
    const [credential] = await this.db
      .select()
      .from(credentials)
      .where(eq(credentials.id, credentialId));

    if (!credential) {
      throw new BadRequestException("Credential not found");
    }

    if (!credential.clientId || !credential.clientSecret) {
      throw new BadRequestException(
        "Credential does not have client ID and secret configured",
      );
    }

    if (!credential.accessToken || !credential.refreshToken) {
      throw new BadRequestException(
        "Credential does not have access token. Please re-authenticate.",
      );
    }

    const pubSubTopic = process.env.GMAIL_PUB_SUB_TOPIC;
    if (!pubSubTopic) {
      throw new BadRequestException(
        "GMAIL_PUB_SUB_TOPIC environment variable is not set. Please configure a Pub/Sub topic in Google Cloud Console.",
      );
    }

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      credential.clientId,
      credential.clientSecret,
    );

    oauth2Client.setCredentials({
      access_token: credential.accessToken,
      refresh_token: credential.refreshToken,
      expiry_date: credential.expiresAt
        ? new Date(credential.expiresAt).getTime()
        : undefined,
    });

    // Refresh token if needed
    try {
      const tokenInfo = await oauth2Client.getAccessToken();
      if (!tokenInfo.token) {
        throw new Error("No access token");
      }
    } catch (error) {
      const { credentials: newTokens } =
        await oauth2Client.refreshAccessToken();
      oauth2Client.setCredentials(newTokens);

      // Update credential in database
      await this.db
        .update(credentials)
        .set({
          accessToken: newTokens.access_token,
          expiresAt: newTokens.expiry_date
            ? new Date(newTokens.expiry_date)
            : null,
          updatedAt: new Date(),
        })
        .where(eq(credentials.id, credentialId));
    }

    // Create Gmail client
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    // Set up watch
    try {
      const watchResponse = await gmail.users.watch({
        userId: "me",
        requestBody: {
          topicName: pubSubTopic,
          labelIds: labelIds || ["INBOX"], // Default to INBOX if not specified
        },
      });

      const historyId = watchResponse.data.historyId || "";
      const expiration = watchResponse.data.expiration || "";

      if (!historyId || !expiration) {
        throw new BadRequestException(
          "Failed to set up Gmail watch: Invalid response from Gmail API",
        );
      }

      return {
        historyId,
        expiration,
      };
    } catch (error: any) {
      const errorMessage =
        error?.message || "Failed to set up Gmail watch";
      console.error("[GmailWatchService] Error setting up watch:", error);

      // Handle specific Gmail API errors
      if (errorMessage.includes("push notification")) {
        throw new BadRequestException(
          "Gmail Push API is not enabled. Please enable it in Google Cloud Console and grant the necessary permissions.",
        );
      }

      if (errorMessage.includes("topic")) {
        throw new BadRequestException(
          `Pub/Sub topic not found or not accessible: ${pubSubTopic}. Please verify the topic exists and the Gmail service account has publish permissions.`,
        );
      }

      throw new BadRequestException(
        `Failed to set up Gmail watch: ${errorMessage}`,
      );
    }
  }

  /**
   * Stops a Gmail watch by calling stop()
   */
  async stopWatch(credentialId: number): Promise<void> {
    const [credential] = await this.db
      .select()
      .from(credentials)
      .where(eq(credentials.id, credentialId));

    if (!credential) {
      throw new BadRequestException("Credential not found");
    }

    if (!credential.clientId || !credential.clientSecret) {
      throw new BadRequestException(
        "Credential does not have client ID and secret configured",
      );
    }

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      credential.clientId,
      credential.clientSecret,
    );

    oauth2Client.setCredentials({
      access_token: credential.accessToken || undefined,
      refresh_token: credential.refreshToken || undefined,
      expiry_date: credential.expiresAt
        ? new Date(credential.expiresAt).getTime()
        : undefined,
    });

    // Create Gmail client
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    try {
      await gmail.users.stop({
        userId: "me",
      });
    } catch (error: any) {
      console.error("[GmailWatchService] Error stopping watch:", error);
      // Don't throw - watch might already be stopped or expired
    }
  }

  /**
   * Renews a Gmail watch before it expires
   * Gmail watches expire after 7 days
   */
  async renewWatch(
    workflowId: number,
    credentialId: number,
    labelIds?: string[],
  ): Promise<GmailWatchResponse> {
    // Stop existing watch first
    try {
      await this.stopWatch(credentialId);
    } catch (error) {
      // Ignore errors - watch might already be expired
      console.log(
        `[GmailWatchService] Could not stop existing watch for workflow ${workflowId}, continuing with renewal`,
      );
    }

    // Set up new watch
    const watchInfo = await this.setupWatch(credentialId, labelIds);

    // Update workflow with new watch info
    await this.db
      .update(workflows)
      .set({
        gmailHistoryId: watchInfo.historyId,
        gmailWatchExpiration: new Date(parseInt(watchInfo.expiration)),
        updatedAt: new Date(),
      })
      .where(eq(workflows.id, workflowId));

    return watchInfo;
  }

  /**
   * Checks if a watch needs renewal (within 1 day of expiration)
   */
  async needsRenewal(workflowId: number): Promise<boolean> {
    const [workflow] = await this.db
      .select()
      .from(workflows)
      .where(eq(workflows.id, workflowId));

    if (!workflow || !workflow.gmailWatchExpiration) {
      return false;
    }

    const expirationDate = new Date(workflow.gmailWatchExpiration);
    const oneDayFromNow = new Date(Date.now() + 24 * 60 * 60 * 1000);

    return expirationDate <= oneDayFromNow;
  }
}

