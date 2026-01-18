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
import { NewStarTrigger } from "./triggers/github-triggers";
import { WorkflowsService } from "../workflows/workflows.service";
import { GitHubClient } from "./github-client";

@Injectable()
export class GitHubPollingService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(GitHubPollingService.name);
  private readonly pollIntervalMs = 30000;
  private isPolling = false;
  private pollingIntervalId: NodeJS.Timeout | null = null;
  private processingCredentials = new Set<number>();

  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly newStarTrigger: NewStarTrigger,
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
      `Starting GitHub polling (interval: ${this.pollIntervalMs}ms)`,
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
    const starRegistrations = this.newStarTrigger.getRegistrations();

    if (starRegistrations.size === 0) return;

    const allWorkflowIds = [...starRegistrations.keys()];

    const workflowRows = await this.db
      .select({ id: workflows.id, userId: workflows.userId })
      .from(workflows)
      .where(inArray(workflows.id, allWorkflowIds));

    const userIds = [...new Set(workflowRows.map((w) => w.userId))];
    if (userIds.length === 0) return;

    const credentialRows = await this.db
      .select()
      .from(credentials)
      .where(
        and(
          eq(credentials.serviceProvider, "github"),
          inArray(credentials.userId, userIds),
        ),
      );

    const credMap = new Map<number, (typeof credentialRows)[0]>();
    credentialRows.forEach((c) => credMap.set(c.id, c));

    const userDefaultCred = new Map<string, (typeof credentialRows)[0]>();
    credentialRows.forEach((c) => {
      const existing = userDefaultCred.get(c.userId);
      if (!existing || existing.updatedAt < c.updatedAt)
        userDefaultCred.set(c.userId, c);
    });

    const tasksByCredential = new Map<
      number,
      { workflowId: number; config: any }[]
    >();

    starRegistrations.forEach((reg, workflowId) => {
      const wf = workflowRows.find((w) => w.id === workflowId);
      if (!wf) return;

      let cred = reg.credentialsId
        ? credMap.get(reg.credentialsId)
        : userDefaultCred.get(wf.userId);

      if (cred && cred.userId !== wf.userId) {
        cred = userDefaultCred.get(wf.userId);
      }

      if (cred) {
        if (!tasksByCredential.has(cred.id)) {
          tasksByCredential.set(cred.id, []);
        }
        tasksByCredential.get(cred.id)!.push({
          workflowId,
          config: reg.config,
        });
      }
    });

    const promises = Array.from(tasksByCredential.entries())
      .map(([cid, tasks]) => {
        const cred = credMap.get(cid);
        return cred ? this.checkCredential(cred, tasks) : null;
      })
      .filter((p): p is Promise<void> => p !== null);

    await Promise.allSettled(promises);
  }

  private async checkCredential(
    credential: any,
    tasks: { workflowId: number; config: any }[],
  ) {
    if (this.processingCredentials.has(credential.id)) return;
    this.processingCredentials.add(credential.id);

    try {
      const client = new GitHubClient({
        data: {
          accessToken: credential.accessToken,
        },
      });

      const state = credential.pollingState || {
        repoStars: {},
      };
      let stateChanged = false;

      for (const task of tasks) {
        const { owner, repo } = task.config;
        const repoKey = `${owner}/${repo}`;

        try {
          const stars = (await client.getStargazers(owner, repo, 10)) as any[];

          if (stars.length === 0) continue;

          const latestStar = stars[0];
          const latestStarId = latestStar.user.id;
          const previousStarId = state.repoStars[repoKey];

          if (!previousStarId) {
            state.repoStars[repoKey] = latestStarId;
            stateChanged = true;
            continue;
          }

          const newStars: any[] = [];
          for (const star of stars) {
            if (star.user.id === previousStarId) {
              break;
            }
            newStars.push(star);
          }

          newStars.reverse();

          for (const star of newStars) {
            const triggerData = {
              action: "starred",
              repository: {
                name: repo,
                fullName: repoKey,
                url: `https://github.com/${repoKey}`,
              },
              sender: {
                login: star.user.login,
                url: star.user.html_url,
              },
              starredAt: star.starred_at,
            };

            await this.workflowsService.triggerWorkflowExecution(
              task.workflowId,
              triggerData,
            );
          }

          if (newStars.length > 0) {
            state.repoStars[repoKey] = latestStarId;
            stateChanged = true;
          }
        } catch (e) {
          this.logger.error(
            `Error polling stars for ${repoKey} (cred ${credential.id}): ${(e as Error).message}`,
          );
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
        `Fatal polling error for cred ${credential.id}: ${(e as Error).message}`,
      );
    } finally {
      this.processingCredentials.delete(credential.id);
    }
  }
}
