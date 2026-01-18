import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  Inject,
} from "@nestjs/common";
import { google } from "googleapis";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { and, eq, inArray } from "drizzle-orm";
import { DRIZZLE } from "../../db/drizzle.module";
import * as schema from "../../db/schema";
import { credentials, workflows } from "../../db/schema";
import { ReceiveEmailTrigger } from "./triggers/receive-email.trigger";
import { WorkflowsService } from "../workflows/workflows.service";
import { GmailClient } from "./gmail-client";

type CredentialRow = typeof credentials.$inferSelect;

interface WorkflowRegistration {
  workflowId: number;
  userId: string;
  config: Record<string, any>;
}

@Injectable()
export class GmailPollingService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(GmailPollingService.name);
  private readonly pollIntervalMs = Number(
    process.env.GMAIL_POLL_INTERVAL_MS || 5000,
  );
  private isPolling = false;
  private pollingIntervalId: NodeJS.Timeout | null = null;
  private lastHistoryIds = new Map<number, string>();
  private processingCredentials = new Set<number>();

  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly receiveEmailTrigger: ReceiveEmailTrigger,
    private readonly workflowsService: WorkflowsService,
  ) {}

  async onModuleInit() {
    await this.startPolling();
  }

  onModuleDestroy() {
    this.stopPolling();
  }

  async startPolling() {
    if (this.isPolling) {
      return;
    }

    this.isPolling = true;
    this.logger.log(
      `Starting Gmail polling (interval: ${this.pollIntervalMs}ms)`,
    );

    await this.pollAllRegistrations();

    this.pollingIntervalId = setInterval(async () => {
      if (this.isPolling) {
        await this.pollAllRegistrations();
      }
    }, this.pollIntervalMs);
  }

  stopPolling() {
    this.isPolling = false;
    if (this.pollingIntervalId) {
      clearInterval(this.pollingIntervalId);
      this.pollingIntervalId = null;
    }
  }

  private async pollAllRegistrations() {
    const registrations = this.receiveEmailTrigger.getRegistrations();
    if (registrations.size === 0) {
      this.logger.debug("No Gmail workflow registrations found");
      return;
    }

    this.logger.debug(`Polling Gmail for ${registrations.size} workflow(s)`);
    const workflowIds = Array.from(registrations.keys());

    const workflowRows = await this.db
      .select({
        id: workflows.id,
        userId: workflows.userId,
      })
      .from(workflows)
      .where(inArray(workflows.id, workflowIds));

    const workflowsById = new Map<number, { id: number; userId: string }>(
      workflowRows.map((row) => [row.id, row]),
    );

    const userIds = Array.from(new Set(workflowRows.map((row) => row.userId)));

    const credentialRows =
      userIds.length > 0
        ? await this.db
            .select()
            .from(credentials)
            .where(
              and(
                eq(credentials.serviceProvider, "gmail" as any),
                inArray(credentials.userId, userIds),
              ),
            )
        : [];

    const credentialsById = new Map(
      credentialRows.map((credential) => [credential.id, credential]),
    );

    const defaultCredentialByUser = new Map<string, CredentialRow>();
    for (const credential of credentialRows) {
      const current = defaultCredentialByUser.get(credential.userId);
      if (!current || current.updatedAt < credential.updatedAt) {
        defaultCredentialByUser.set(credential.userId, credential);
      }
    }

    const workflowsByCredential = new Map<number, WorkflowRegistration[]>();

    for (const [workflowId, registration] of registrations.entries()) {
      const workflow = workflowsById.get(workflowId);
      if (!workflow) {
        continue;
      }

      let credential =
        (registration.credentialsId
          ? credentialsById.get(registration.credentialsId)
          : null) || defaultCredentialByUser.get(workflow.userId);

      if (!credential) {
        this.logger.warn(
          `No Gmail credentials found for workflow ${workflowId} (user ${workflow.userId})`,
        );
        continue;
      }

      if (credential.userId !== workflow.userId) {
        this.logger.warn(
          `Credential ${credential.id} does not belong to workflow user ${workflow.userId}, skipping`,
        );
        credential = defaultCredentialByUser.get(workflow.userId);
      }

      if (!credential) {
        continue;
      }

      const list = workflowsByCredential.get(credential.id) || [];
      list.push({
        workflowId,
        userId: workflow.userId,
        config: registration.config,
      });
      workflowsByCredential.set(credential.id, list);
    }

    await Promise.allSettled(
      Array.from(workflowsByCredential.entries()).map(
        async ([credentialId, workflowRegistrations]) => {
          const credential = credentialsById.get(credentialId);
          if (!credential) {
            return;
          }
          await this.checkCredentialEmails(credential, workflowRegistrations);
        },
      ),
    );
  }

  private async ensureAccessToken(credential: CredentialRow) {
    if (!credential.accessToken) {
      throw new Error("Missing access token");
    }

    const expiresAt = credential.expiresAt?.getTime() || 0;
    const needsRefresh = expiresAt > 0 && expiresAt <= Date.now() + 60_000;

    if (!needsRefresh) {
      return credential;
    }

    if (!credential.refreshToken) {
      throw new Error("Missing refresh token");
    }

    if (!credential.clientId || !credential.clientSecret) {
      throw new Error("Missing OAuth2 client credentials");
    }

    const oauth2Client = new google.auth.OAuth2(
      credential.clientId,
      credential.clientSecret,
    );
    oauth2Client.setCredentials({ refresh_token: credential.refreshToken });

    const { credentials: newTokens } = await oauth2Client.refreshAccessToken();
    const newExpiresAt = newTokens.expiry_date
      ? new Date(newTokens.expiry_date)
      : null;

    await this.db
      .update(credentials)
      .set({
        accessToken: newTokens.access_token || credential.accessToken,
        refreshToken: newTokens.refresh_token || credential.refreshToken,
        expiresAt: newExpiresAt,
        isValid: true,
        updatedAt: new Date(),
      })
      .where(eq(credentials.id, credential.id));

    return {
      ...credential,
      accessToken: newTokens.access_token || credential.accessToken,
      refreshToken: newTokens.refresh_token || credential.refreshToken,
      expiresAt: newExpiresAt,
    };
  }

  private async checkCredentialEmails(
    credential: CredentialRow,
    workflowRegistrations: WorkflowRegistration[],
  ) {
    if (this.processingCredentials.has(credential.id)) {
      return;
    }

    this.processingCredentials.add(credential.id);

    try {
      const refreshedCredential = await this.ensureAccessToken(credential);
      const oauth2Client = new google.auth.OAuth2(
        refreshedCredential.clientId || process.env.GOOGLE_CLIENT_ID,
        refreshedCredential.clientSecret || process.env.GOOGLE_CLIENT_SECRET,
      );
      oauth2Client.setCredentials({
        access_token: refreshedCredential.accessToken || undefined,
        refresh_token: refreshedCredential.refreshToken || undefined,
        expiry_date: refreshedCredential.expiresAt?.getTime(),
      });

      const gmail = google.gmail({ version: "v1", auth: oauth2Client });
      const gmailClient = new GmailClient({
        data: {
          accessToken: refreshedCredential.accessToken || undefined,
          refreshToken: refreshedCredential.refreshToken || undefined,
          expiresAt: refreshedCredential.expiresAt?.getTime(),
        },
        clientId: refreshedCredential.clientId || undefined,
        clientSecret: refreshedCredential.clientSecret || undefined,
      });

      let historyId =
        this.lastHistoryIds.get(credential.id) ||
        refreshedCredential.lastHistoryId ||
        "";

      if (!historyId) {
        this.logger.log(
          `Initializing historyId for credential ${credential.id} (first run)`,
        );
        historyId = await this.getProfileHistoryId(gmail);
        if (historyId) {
          await this.updateHistoryId(credential.id, historyId);
          this.logger.log(
            `Initialized historyId ${historyId} for credential ${credential.id}`,
          );
        }
        return;
      }

      this.logger.debug(
        `Checking for new emails with historyId ${historyId} for credential ${credential.id}`,
      );

      let emails: Array<Record<string, any>> = [];
      try {
        emails = await this.getNewEmails(gmail, gmailClient, historyId);
      } catch (error) {
        const message = (error as Error)?.message || "";
        if (message.includes("Requested entity was not found")) {
          this.logger.warn(
            `HistoryId ${historyId} not found for credential ${credential.id}, re-initializing`,
          );
          const refreshedHistoryId = await this.getProfileHistoryId(gmail);
          if (refreshedHistoryId) {
            await this.updateHistoryId(credential.id, refreshedHistoryId);
            this.logger.log(
              `Re-initialized historyId ${refreshedHistoryId} for credential ${credential.id}`,
            );
          }
          return;
        }
        throw error;
      }

      if (emails.length === 0) {
        this.logger.debug(
          `No new emails found for credential ${credential.id}`,
        );
        return;
      }

      this.logger.log(
        `Found ${emails.length} new email(s) for credential ${credential.id}`,
      );

      for (const email of emails) {
        this.logger.debug(
          `Processing email: ${email.subject} from ${email.from}`,
        );

        for (const workflow of workflowRegistrations) {
          if (!this.receiveEmailTrigger.matchesConfig(email, workflow.config)) {
            this.logger.debug(
              `Email does not match config for workflow ${workflow.workflowId}`,
            );
            continue;
          }

          this.logger.log(
            `Triggering workflow ${workflow.workflowId} for email: ${email.subject}`,
          );

          await this.workflowsService.triggerWorkflowExecution(
            workflow.workflowId,
            email,
          );
        }
      }

      const latestHistoryId = this.findLatestHistoryId(emails);
      if (latestHistoryId) {
        this.logger.debug(
          `Updating historyId to ${latestHistoryId} for credential ${credential.id}`,
        );
        await this.updateHistoryId(credential.id, latestHistoryId);
      }
    } catch (error) {
      this.logger.error(
        `Failed to poll Gmail for credential ${credential.id}: ${error.message}`,
      );
    } finally {
      this.processingCredentials.delete(credential.id);
    }
  }

  private async getProfileHistoryId(gmail: ReturnType<typeof google.gmail>) {
    const profileResponse = await gmail.users.getProfile({ userId: "me" });
    const historyId = profileResponse?.data?.historyId;
    return historyId ? String(historyId) : "";
  }

  private async getNewEmails(
    gmail: ReturnType<typeof google.gmail>,
    gmailClient: GmailClient,
    historyId: string,
  ) {
    const historyResponse = await gmail.users.history.list({
      userId: "me",
      startHistoryId: historyId,
      historyTypes: ["messageAdded"],
    });

    const profileResponse = await gmail.users.getProfile({ userId: "me" });
    const selfEmail = profileResponse?.data?.emailAddress || null;

    const messages: Array<Record<string, any>> = [];
    const history = historyResponse.data.history || [];

    for (const entry of history) {
      const entryHistoryId = entry.id ? String(entry.id) : undefined;
      if (!entry.messagesAdded) {
        continue;
      }

      for (const msg of entry.messagesAdded) {
        if (!msg.message?.id) {
          continue;
        }

        const messageResponse = await gmail.users.messages.get({
          userId: "me",
          id: msg.message.id,
          format: "full",
        });

        const data = messageResponse.data as any;
        const headers = data?.payload?.headers || [];
        const headerMap = new Map(
          headers
            .filter((header: { name?: string }) => header?.name)
            .map((header: { name: string; value: string }) => [
              header.name.toLowerCase(),
              header.value,
            ]),
        );

        if (headerMap.get("x-area-generated")) {
          continue;
        }

        const from = String(headerMap.get("from") || "");
        if (selfEmail && from.includes(selfEmail)) {
          continue;
        }

        const details = gmailClient.getMessageDetails(data);
        messages.push({
          messageId: details.id,
          threadId: details.threadId,
          from: details.from,
          to: details.to,
          subject: details.subject,
          body: details.body,
          htmlBody: details.htmlBody,
          date: details.date,
          attachments: details.attachments,
          historyId: entryHistoryId,
        });
      }
    }

    return messages;
  }

  private findLatestHistoryId(emails: Array<Record<string, any>>) {
    let latest: bigint | null = null;
    for (const email of emails) {
      if (!email.historyId) {
        continue;
      }
      try {
        const current = BigInt(email.historyId);
        if (!latest || current > latest) {
          latest = current;
        }
      } catch {
        continue;
      }
    }
    return latest ? latest.toString() : "";
  }

  private async updateHistoryId(credentialId: number, historyId: string) {
    if (!historyId) {
      return;
    }

    this.lastHistoryIds.set(credentialId, historyId);

    await this.db
      .update(credentials)
      .set({ lastHistoryId: historyId, updatedAt: new Date() })
      .where(eq(credentials.id, credentialId));
  }
}
