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
import { NewEventTrigger } from "./triggers/new-event.trigger";
import { EventCancelledTrigger } from "./triggers/event-cancelled.trigger";
import { WorkflowsService } from "../workflows/workflows.service";
import { GoogleCalendarClient } from "./google-calendar-client";

type CredentialRow = typeof credentials.$inferSelect;

interface WorkflowRegistration {
  workflowId: number;
  userId: string;
  config: Record<string, any>;
}

@Injectable()
export class GoogleCalendarPollingService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(GoogleCalendarPollingService.name);
  private readonly pollIntervalMs = 10000; // 10 seconds
  private isPolling = false;
  private pollingIntervalId: NodeJS.Timeout | null = null;
  private lastSyncTokens = new Map<number, string>(); // credentialId -> syncToken
  private processingCredentials = new Set<number>();

  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly newEventTrigger: NewEventTrigger,
    private readonly eventCancelledTrigger: EventCancelledTrigger,
    private readonly workflowsService: WorkflowsService,
  ) {}

  async onModuleInit() {
    await this.startPolling();
  }

  onModuleDestroy() {
    this.stopPolling();
  }

  async startPolling() {
    if (this.isPolling) return;
    this.isPolling = true;
    this.logger.log(
      `Starting Google Calendar polling (interval: ${this.pollIntervalMs}ms)`,
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
    const registrations = this.newEventTrigger.getRegistrations();
    if (registrations.size === 0) return;

    const workflowIds = Array.from(registrations.keys());
    const workflowRows = await this.db
      .select({ id: workflows.id, userId: workflows.userId })
      .from(workflows)
      .where(inArray(workflows.id, workflowIds));

    // Group workflows by credential
    const workflowsByCredential = new Map<number, WorkflowRegistration[]>();
    const credentialsToCheck = new Set<number>();

    for (const [workflowId, reg] of registrations.entries()) {
      const workflow = workflowRows.find((w) => w.id === workflowId);
      if (!workflow || !reg.credentialsId) continue;

      credentialsToCheck.add(reg.credentialsId);
      const list = workflowsByCredential.get(reg.credentialsId) || [];
      list.push({
        workflowId,
        userId: workflow.userId,
        config: reg.config,
      });
      workflowsByCredential.set(reg.credentialsId, list);
    }

    if (credentialsToCheck.size === 0) return;

    const credentialRows = await this.db
      .select()
      .from(credentials)
      .where(inArray(credentials.id, Array.from(credentialsToCheck)));
    const credentialsById = new Map(credentialRows.map((c) => [c.id, c]));

    await Promise.allSettled(
      Array.from(workflowsByCredential.entries()).map(
        async ([credentialId, wfSettings]) => {
          const credential = credentialsById.get(credentialId);
          if (credential) {
            await this.checkCredentialEvents(credential, wfSettings);
          }
        },
      ),
    );
  }

  private async ensureAccessToken(credential: CredentialRow) {
    if (!credential.accessToken) throw new Error("Missing access token");

    const expiresAt = credential.expiresAt?.getTime() || 0;
    const needsRefresh = expiresAt > 0 && expiresAt <= Date.now() + 60_000;

    if (!needsRefresh) return credential;
    if (!credential.refreshToken) throw new Error("Missing refresh token");

    const oauth2Client = new google.auth.OAuth2(
      credential.clientId ?? undefined,
      credential.clientSecret ?? undefined,
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
      expiresAt: newExpiresAt,
    };
  }

  private async checkCredentialEvents(
    credential: CredentialRow,
    workflows: WorkflowRegistration[],
  ) {
    if (this.processingCredentials.has(credential.id)) return;
    this.processingCredentials.add(credential.id);

    try {
      const refreshed = await this.ensureAccessToken(credential);
      const client = new GoogleCalendarClient({
        data: {
          accessToken: refreshed.accessToken || undefined,
          refreshToken: refreshed.refreshToken || undefined,
          expiresAt: refreshed.expiresAt?.getTime(),
        },
        clientId: refreshed.clientId ?? undefined,
        clientSecret: refreshed.clientSecret ?? undefined,
      });

      // Use syncToken if available, otherwise fetch initial state and store syncToken
      const syncToken =
        this.lastSyncTokens.get(credential.id) ||
        (refreshed.lastHistoryId ? refreshed.lastHistoryId : undefined);

      // Should properly store syncToken in DB (using lastHistoryId field for now as it's a string)

      try {
        const result = await client.listEvents({
          calendarId: "primary",
          syncToken: syncToken,
          maxResults: 50,
        });

        // If we didn't have a syncToken, we just save the new one and don't trigger (to avoid triggering for all existing events)
        if (!syncToken && result.nextSyncToken) {
          await this.updateSyncToken(credential.id, result.nextSyncToken);
          return;
        }

        if (result.events && result.events.length > 0) {
          for (const event of result.events) {
            const updatedTime = new Date(event.updated || 0).getTime();
            const isRecent = Date.now() - updatedTime < 5 * 60 * 1000;
            if (!isRecent && syncToken) {
              // If we have a sync token, we trust the API to return only changed events.
              // But if the change is very old, maybe we shouldn't trigger?
              // Using syncToken usually implies "changes since X", so they are "new" to us.
              // However, without a persistent store of "last processed event", duplicate triggers on restart might happen if syncToken is not strictly incremental/reliable across restarts without offsets.
              // But let's assume syncToken handling is enough.
            }

            // New/Updated Event
            if (event.status === "confirmed" && event.created) {
              // Check if it's new (created ~= updated) or just updated?
              // Google doesn't separate easy.
              // For "New Event", we usually check if created time is close to now, OR if we track IDs.
              // But relying on "created" timestamp is safer for "New Event".
              const createdTime = new Date(event.created).getTime();
              if (Date.now() - createdTime < 5 * 60 * 1000) {
                for (const wf of workflows) {
                  // Only trigger if this workflow listens to "New Event"
                  // TODO: We need to know WHICH trigger mechanism requested this workflow.
                  // Current architecture combines all registrations in `workflows`.
                  // So we need to check if the workflow ID exists in `newEventTrigger.registrations`.
                  if (
                    this.newEventTrigger.getRegistrations().has(wf.workflowId)
                  ) {
                    await this.workflowsService.triggerWorkflowExecution(
                      wf.workflowId,
                      {
                        eventId: event.id,
                        summary: event.summary,
                        description: event.description,
                        location: event.location,
                        start: event.start?.dateTime || event.start?.date,
                        end: event.end?.dateTime || event.end?.date,
                        link: event.htmlLink,
                      },
                    );
                  }
                }
              }
            }

            // Cancelled Event
            if (event.status === "cancelled") {
              for (const wf of workflows) {
                if (
                  this.eventCancelledTrigger
                    .getRegistrations()
                    .has(wf.workflowId)
                ) {
                  await this.workflowsService.triggerWorkflowExecution(
                    wf.workflowId,
                    {
                      eventId: event.id,
                      summary: event.summary, // Summary might be empty for cancelled events?
                    },
                  );
                }
              }
            }
          }
        }

        if (result.nextSyncToken) {
          await this.updateSyncToken(credential.id, result.nextSyncToken);
        }
      } catch (err: any) {
        if (
          err.message &&
          (err.message.includes("syncToken") || err.code === 410)
        ) {
          // Sync token expired/invalid, do a full sync without token to get a new one
          this.logger.warn(
            `Sync token expired for credential ${credential.id}, resetting.`,
          );
          const res = await client.listEvents({ calendarId: "primary" });
          if (res.nextSyncToken) {
            await this.updateSyncToken(credential.id, res.nextSyncToken);
          }
        } else {
          throw err;
        }
      }
    } catch (error: any) {
      this.logger.error(
        `Failed to poll Calendar for ${credential.id}: ${error.message}`,
      );
    } finally {
      this.processingCredentials.delete(credential.id);
    }
  }

  private async updateSyncToken(credentialId: number, token: string) {
    this.lastSyncTokens.set(credentialId, token);
    await this.db
      .update(credentials)
      .set({ lastHistoryId: token, updatedAt: new Date() }) // Reusing lastHistoryId column for syncToken
      .where(eq(credentials.id, credentialId));
  }
}
