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
  StreamStartedTrigger,
  StreamEndedTrigger,
  NewFollowerTrigger,
  ViewerCountThresholdTrigger,
} from "./triggers/twitch-triggers";
import { WorkflowsService } from "../workflows/workflows.service";
import { TwitchClient } from "./twitch-client";

@Injectable()
export class TwitchPollingService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TwitchPollingService.name);
  private readonly pollIntervalMs = 20000;
  private isPolling = false;
  private pollingIntervalId: NodeJS.Timeout | null = null;
  private processingCredentials = new Set<number>();

  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly streamStartedTrigger: StreamStartedTrigger,
    private readonly streamEndedTrigger: StreamEndedTrigger,
    private readonly newFollowerTrigger: NewFollowerTrigger,
    private readonly viewerCountTrigger: ViewerCountThresholdTrigger,
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
      `Starting Twitch polling (interval: ${this.pollIntervalMs}ms)`,
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
    const regStarted = this.streamStartedTrigger.getRegistrations();
    const regEnded = this.streamEndedTrigger.getRegistrations();
    const regFollower = this.newFollowerTrigger.getRegistrations();
    const regViewer = this.viewerCountTrigger.getRegistrations();

    const allRegs = [regStarted, regEnded, regFollower, regViewer];
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
          eq(credentials.serviceProvider, "twitch"),
          inArray(credentials.userId, userIds),
        ),
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
      {
        started: number[];
        ended: number[];
        follower: number[];
        viewer: number[];
      }
    >();

    const addToMap = (
      wid: number,
      reg: any,
      type: "started" | "ended" | "follower" | "viewer",
    ) => {
      const wf = workflowRows.find((w) => w.id === wid);
      if (!wf) return;
      let cred = reg.credentialsId
        ? credMap.get(reg.credentialsId)
        : userDefaultCred.get(wf.userId);
      if (cred && cred.userId !== wf.userId)
        cred = userDefaultCred.get(wf.userId);
      if (cred) {
        if (!tasksByCredential.has(cred.id))
          tasksByCredential.set(cred.id, {
            started: [],
            ended: [],
            follower: [],
            viewer: [],
          });
        tasksByCredential.get(cred.id)![type].push(wid);
      }
    };

    regStarted.forEach((v, k) => addToMap(k, v, "started"));
    regEnded.forEach((v, k) => addToMap(k, v, "ended"));
    regFollower.forEach((v, k) => addToMap(k, v, "follower"));
    regViewer.forEach((v, k) => addToMap(k, v, "viewer"));

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
      const client = new TwitchClient({
        clientId: credential.clientId,
        clientSecret: credential.clientSecret,
        data: {
          accessToken: credential.accessToken,
          refreshToken: credential.refreshToken,
          expiresAt: credential.expiresAt?.getTime(),
        },
      });

      const state = credential.pollingState || {
        isLive: false,
        lastFollowers: null,
        lastViewerCount: 0,
      };
      let stateChanged = false;

      const userInfo = await client.getUserInfo();
      if (!userInfo) return;
      const userId = userInfo.id;

      if (
        tasks.started.length > 0 ||
        tasks.ended.length > 0 ||
        tasks.viewer.length > 0
      ) {
        const streamInfo = await client.getStreamInfo(userId);
        const isLive = !!streamInfo;

        if (tasks.started.length > 0 && isLive && !state.isLive) {
          const data = {
            startedAt: streamInfo.started_at,
            title: streamInfo.title,
          };
          for (const wid of tasks.started)
            await this.workflowsService.triggerWorkflowExecution(wid, data);
        }

        if (tasks.ended.length > 0 && !isLive && state.isLive) {
          const data = { endedAt: new Date().toISOString() };
          for (const wid of tasks.ended)
            await this.workflowsService.triggerWorkflowExecution(wid, data);
        }

        if (tasks.viewer.length > 0 && isLive) {
          const registrationMap = this.viewerCountTrigger.getRegistrations();
          const viewers = streamInfo.viewer_count;
          for (const wid of tasks.viewer) {
            const regId = wid;
            const reg = registrationMap.get(regId);
            if (
              reg &&
              viewers >= reg.config.threshold &&
              state.lastViewerCount < reg.config.threshold
            ) {
              await this.workflowsService.triggerWorkflowExecution(wid, {
                viewerCount: viewers,
              });
            }
          }
        }

        if (state.isLive !== isLive) {
          state.isLive = isLive;
          stateChanged = true;
        }
        if (isLive && state.lastViewerCount !== streamInfo.viewer_count) {
          state.lastViewerCount = streamInfo.viewer_count;
          stateChanged = true;
        }
      }

      if (tasks.follower.length > 0) {
        const followerData = await client.getFollowers(userId);
        const followers = followerData || [];
        const savedIds = new Set(state.lastFollowers || []);

        if (!state.lastFollowers || state.lastFollowers.length === 0) {
          state.lastFollowers = followers.map((f: any) => f.user_id);
          stateChanged = true;
        } else {
          const newFollowers = followers.filter(
            (f: any) => !savedIds.has(f.user_id),
          );
          for (const f of newFollowers) {
            const data = {
              followerName: f.user_name,
              followerId: f.user_id,
              followedAt: f.followed_at,
            };
            for (const wid of tasks.follower)
              await this.workflowsService.triggerWorkflowExecution(wid, data);
          }
          if (newFollowers.length > 0) {
            state.lastFollowers = followers.map((f: any) => f.user_id);
            stateChanged = true;
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
        `Error polling Twitch for cred ${credential.id}: ${(e as Error).message}`,
      );
    } finally {
      this.processingCredentials.delete(credential.id);
    }
  }
}
