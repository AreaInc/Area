import { Injectable, OnModuleInit, Inject } from "@nestjs/common";
import { GmailWatchService } from "./gmail-watch.service";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { DRIZZLE } from "../../db/drizzle.module";
import * as schema from "../../db/schema";
import { workflows } from "../../db/schema";
import { eq, and, isNotNull } from "drizzle-orm";

@Injectable()
export class GmailWatchRenewalService implements OnModuleInit {
  private renewalInterval: NodeJS.Timeout | null = null;

  constructor(
    private readonly gmailWatchService: GmailWatchService,
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  onModuleInit() {
    // Check for watches that need renewal every 6 hours
    this.renewalInterval = setInterval(() => {
      this.renewExpiringWatches().catch((error) => {
        console.error("[GmailWatchRenewal] Error renewing watches:", error);
      });
    }, 6 * 60 * 60 * 1000); // 6 hours

    // Run immediately on startup
    this.renewExpiringWatches().catch((error) => {
      console.error("[GmailWatchRenewal] Error renewing watches on startup:", error);
    });

    console.log("[GmailWatchRenewal] Watch renewal service started");
  }

  async renewExpiringWatches(): Promise<void> {
    console.log("[GmailWatchRenewal] Checking for watches that need renewal...");

    // Find all active Gmail workflows with watch expiration within 1 day
    const activeWorkflows = await this.db
      .select()
      .from(workflows)
      .where(
        and(
          eq(workflows.triggerProvider, "gmail"),
          eq(workflows.triggerId, "receive-email"),
          eq(workflows.isActive, true),
          isNotNull(workflows.gmailWatchExpiration),
          isNotNull(workflows.actionCredentialsId),
        ),
      );

    const oneDayFromNow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    let renewed = 0;
    let failed = 0;

    for (const workflow of activeWorkflows) {
      if (!workflow.gmailWatchExpiration || !workflow.actionCredentialsId) {
        continue;
      }

      const expirationDate = new Date(workflow.gmailWatchExpiration);

      // Renew if expiration is within 1 day
      if (expirationDate <= oneDayFromNow) {
        try {
          console.log(
            `[GmailWatchRenewal] Renewing watch for workflow ${workflow.id} (expires: ${expirationDate.toISOString()})`,
          );

          const labelIds = (workflow.triggerConfig as any)?.labelIds as
            | string[]
            | undefined;

          await this.gmailWatchService.renewWatch(
            workflow.id,
            workflow.actionCredentialsId,
            labelIds,
          );

          renewed++;
          console.log(
            `[GmailWatchRenewal] Successfully renewed watch for workflow ${workflow.id}`,
          );
        } catch (error: any) {
          failed++;
          console.error(
            `[GmailWatchRenewal] Failed to renew watch for workflow ${workflow.id}:`,
            error?.message || error,
          );
        }
      }
    }

    if (renewed > 0 || failed > 0) {
      console.log(
        `[GmailWatchRenewal] Renewal complete: ${renewed} renewed, ${failed} failed`,
      );
    }
  }

  onModuleDestroy() {
    if (this.renewalInterval) {
      clearInterval(this.renewalInterval);
      console.log("[GmailWatchRenewal] Watch renewal service stopped");
    }
  }
}

