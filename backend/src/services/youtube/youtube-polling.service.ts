import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
  Inject,
} from "@nestjs/common";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { and, eq, inArray } from "drizzle-orm";
import { DRIZZLE } from "../../db/drizzle.module";
import * as schema from "../../db/schema";
import { credentials, workflows } from "../../db/schema";
import {
  NewLikedVideoTrigger,
  NewVideoFromChannelTrigger,
} from "./triggers/youtube-triggers";
import { WorkflowsService } from "../workflows/workflows.service";
import { YouTubeClient } from "./youtube-client";

@Injectable()
export class YouTubePollingService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(YouTubePollingService.name);
  private readonly pollIntervalMs = 60000; // 1 min (Quota management)
  private isPolling = false;
  private pollingIntervalId: NodeJS.Timeout | null = null;
  private processingCredentials = new Set<number>();

  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly newLikedVideoTrigger: NewLikedVideoTrigger,
    private readonly newVideoFromChannelTrigger: NewVideoFromChannelTrigger,
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
      `Starting YouTube polling (interval: ${this.pollIntervalMs}ms)`,
    );
    await this.poll();
    this.pollingIntervalId = setInterval(() => {
      if (this.isPolling) void this.poll();
    }, this.pollIntervalMs);
  }

  stopPolling() {
    this.isPolling = false;
    if (this.pollingIntervalId) {
      clearInterval(this.pollingIntervalId);
      this.pollingIntervalId = null;
    }
  }

  private async poll() {
    const regLiked = this.newLikedVideoTrigger.getRegistrations();
    const regChannel = this.newVideoFromChannelTrigger.getRegistrations();

    const allRegs = [regLiked, regChannel];
    if (allRegs.every((r) => r.size === 0)) return;

    const allWorkflowIds = new Set<number>();
    allRegs.forEach((r) => {
      for (const k of r.keys()) allWorkflowIds.add(k);
    });

    const workflowIds = Array.from(allWorkflowIds);
    const workflowRows = await this.db
      .select({ id: workflows.id, userId: workflows.userId })
      .from(workflows)
      .where(inArray(workflows.id, workflowIds));

    const userIds = [...new Set(workflowRows.map((w) => w.userId))];
    if (userIds.length === 0) return;

    const credentialRows = await this.db
      .select()
      .from(credentials)
      .where(
        and(
          eq(credentials.serviceProvider, "youtube"),
          inArray(credentials.userId, userIds),
        ),
      );

    this.logger.log(
      `Found ${credentialRows.length} YouTube credentials for ${userIds.length} users`,
    );

    const credMap = new Map();
    credentialRows.forEach((c) => credMap.set(c.id, c));
    const userDefaultCred = new Map();
    credentialRows.forEach((c) => {
      const existing = userDefaultCred.get(c.userId);
      if (!existing || existing.updatedAt < c.updatedAt)
        userDefaultCred.set(c.userId, c);
    });

    const tasksByCredential = new Map<
      number,
      { liked: number[]; channel: number[] }
    >();

    const addToMap = (wid: number, reg: any, type: "liked" | "channel") => {
      const wf = workflowRows.find((w) => w.id === wid);
      if (!wf) return;
      let cred = reg.credentialsId
        ? credMap.get(reg.credentialsId)
        : userDefaultCred.get(wf.userId);
      if (cred && cred.userId !== wf.userId)
        cred = userDefaultCred.get(wf.userId);
      if (cred) {
        if (!tasksByCredential.has(cred.id))
          tasksByCredential.set(cred.id, { liked: [], channel: [] });
        tasksByCredential.get(cred.id)![type].push(wid);
      }
    };

    regLiked.forEach((v, k) => addToMap(k, v, "liked"));
    regChannel.forEach((v, k) => addToMap(k, v, "channel"));

    const promises = Array.from(tasksByCredential.entries())
      .map(([cid, tasks]) => {
        const cred = credMap.get(cid);
        return cred ? this.checkCredential(cred, tasks) : null;
      })
      .filter((p): p is Promise<void> => p !== null);

    await Promise.allSettled(promises);
  }

  private async checkCredential(credential: any, tasks: any) {
    if (this.processingCredentials.has(credential.id)) return;
    this.processingCredentials.add(credential.id);

    try {
      const client = new YouTubeClient({
        clientId: credential.clientId,
        clientSecret: credential.clientSecret,
        data: {
          accessToken: credential.accessToken,
          refreshToken: credential.refreshToken,
          expiresAt: credential.expiresAt?.getTime(),
        },
      });

      // State init
      const state = credential.pollingState || {
        lastLikedVideoId: null,
        channelUploads: {}, // Map channelId -> lastVideoId
      };
      let stateChanged = false;

      // Check Liked Videos
      if (tasks.liked.length > 0) {
        this.logger.debug(`Checking liked videos for cred ${credential.id}`);
        const likedVideos = await client.getLikedVideos(5);
        if (likedVideos.length > 0) {
          const latestVideo = likedVideos[0];
          this.logger.debug(
            `Latest liked video for cred ${credential.id}: ${latestVideo.id} (cached: ${state.lastLikedVideoId})`,
          );

          if (
            state.lastLikedVideoId &&
            state.lastLikedVideoId !== latestVideo.id
          ) {
            this.logger.log(
              `Triggering new_liked_video for cred ${credential.id} - Video: ${latestVideo.id}`,
            );
            // Found new liked video (simplified check: top video changed)
            // In reality, should check if new ID is not in previous cache, etc.
            // For now, if top video ID changed compared to stored ID, trigger.
            const data = {
              videoId: latestVideo.id,
              title: latestVideo.snippet.title,
            };
            for (const wid of tasks.liked)
              await this.workflowsService.triggerWorkflowExecution(wid, data);
          }
          if (state.lastLikedVideoId !== latestVideo.id) {
            state.lastLikedVideoId = latestVideo.id;
            stateChanged = true;
          }
        } else {
          this.logger.debug(`No liked videos found for cred ${credential.id}`);
        }
      }

      // Check Channel Uploads
      if (tasks.channel.length > 0) {
        const regMap = this.newVideoFromChannelTrigger.getRegistrations();
        for (const wid of tasks.channel) {
          const reg = regMap.get(wid);
          if (!reg || !reg.config.channelId) continue;
          const channelId = reg.config.channelId;

          try {
            this.logger.debug(`Checking uploads for channel ${channelId}`);
            const uploads = await client.getLatestUploads(channelId);
            if (uploads.length > 0) {
              const latest = uploads[0];
              const lastSeen = state.channelUploads?.[channelId];

              this.logger.debug(
                `Latest upload for channel ${channelId}: ${latest.id} (cached: ${lastSeen})`,
              );

              if (lastSeen && lastSeen !== latest.id) {
                const data = {
                  videoId: latest.contentDetails.videoId,
                  title: latest.snippet.title,
                  url: `https://www.youtube.com/watch?v=${latest.contentDetails.videoId}`,
                };
                this.logger.log(
                  `Triggering new_video_from_channel for workflow ${wid}`,
                );
                await this.workflowsService.triggerWorkflowExecution(wid, data);
              }

              if (lastSeen !== latest.id) {
                if (!state.channelUploads) state.channelUploads = {};
                state.channelUploads[channelId] = latest.id;
                stateChanged = true;
              }
            }
          } catch {
            this.logger.warn(
              `Failed to check channel ${channelId} for workflow ${wid}`,
            );
          }
        }
      }

      if (stateChanged) {
        await this.db
          .update(credentials)
          .set({ pollingState: state, updatedAt: new Date() })
          .where(eq(credentials.id, credential.id));
      }
    } catch (e) {
      this.logger.error(
        `Error polling YouTube for cred ${credential.id}: ${(e as Error).message}`,
      );
    } finally {
      this.processingCredentials.delete(credential.id);
    }
  }
}
