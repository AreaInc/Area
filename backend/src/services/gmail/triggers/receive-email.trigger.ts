import { Injectable, Inject } from "@nestjs/common";
import { ITrigger, TriggerType } from "../../../common/types/trigger.interface";
import { GmailWatchService } from "../gmail-watch.service";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { DRIZZLE } from "../../../db/drizzle.module";
import * as schema from "../../../db/schema";
import { workflows } from "../../../db/schema";
import { eq } from "drizzle-orm";

@Injectable()
export class ReceiveEmailTrigger implements ITrigger {
  id = "receive-email";
  name = "Receive Email";
  description = "Triggers when a new email is received in Gmail";
  serviceProvider = "gmail";
  triggerType = TriggerType.EVENT;
  requiresCredentials = true;

  constructor(
    private readonly gmailWatchService: GmailWatchService,
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  configSchema = {
    type: "object",
    properties: {
      from: {
        type: "string",
        description: "Filter emails from this sender (optional)",
      },
      subject: {
        type: "string",
        description: "Filter emails with this subject pattern (optional)",
      },
      labelIds: {
        type: "array",
        items: { type: "string" },
        description: "Filter emails with these label IDs (optional)",
      },
    },
  };

  outputSchema = {
    type: "object",
    properties: {
      messageId: { type: "string" },
      threadId: { type: "string" },
      from: { type: "string" },
      to: { type: "string" },
      subject: { type: "string" },
      body: { type: "string" },
      htmlBody: { type: "string" },
      date: { type: "string" },
      attachments: {
        type: "array",
        items: {
          type: "object",
          properties: {
            filename: { type: "string" },
            mimeType: { type: "string" },
            size: { type: "number" },
            attachmentId: { type: "string" },
          },
        },
      },
    },
  };

  private workflowRegistrations = new Map<
    number,
    { config: Record<string, any>; credentialsId?: number }
  >();

  async register(
    workflowId: number,
    config: Record<string, any>,
    credentialsId?: number,
  ): Promise<void> {
    console.log(
      `[ReceiveEmailTrigger] Registering trigger for workflow ${workflowId}`,
      {
        config,
        credentialsId,
      },
    );

    if (!credentialsId) {
      throw new Error(
        "Credentials are required to set up Gmail push notifications",
      );
    }

    // Store registration
    this.workflowRegistrations.set(workflowId, { config, credentialsId });

    // Set up Gmail Push API watch
    try {
      const labelIds = config.labelIds as string[] | undefined;
      const watchInfo = await this.gmailWatchService.setupWatch(
        credentialsId,
        labelIds,
      );

      // Update workflow with watch information
      await this.db
        .update(workflows)
        .set({
          gmailHistoryId: watchInfo.historyId,
          gmailWatchExpiration: new Date(parseInt(watchInfo.expiration)),
          updatedAt: new Date(),
        })
        .where(eq(workflows.id, workflowId));

      console.log(
        `[ReceiveEmailTrigger] Gmail watch set up successfully for workflow ${workflowId}`,
        {
          historyId: watchInfo.historyId,
          expiration: watchInfo.expiration,
        },
      );
    } catch (error: any) {
      console.error(
        `[ReceiveEmailTrigger] Failed to set up Gmail watch for workflow ${workflowId}:`,
        error,
      );
      // Don't throw - allow workflow to be registered even if watch setup fails
      // User can still use test endpoint or manual webhook calls
      console.warn(
        `[ReceiveEmailTrigger] Workflow ${workflowId} registered but Gmail watch not set up. You can still trigger workflows manually via the test endpoint.`,
      );
    }

    console.log(
      `[ReceiveEmailTrigger] Trigger registered successfully for workflow ${workflowId}`,
    );
  }

  async unregister(workflowId: number): Promise<void> {
    console.log(
      `[ReceiveEmailTrigger] Unregistering trigger for workflow ${workflowId}`,
    );

    const registration = this.workflowRegistrations.get(workflowId);

    // Stop Gmail watch if credentials are available
    if (registration?.credentialsId) {
      try {
        await this.gmailWatchService.stopWatch(registration.credentialsId);
        console.log(
          `[ReceiveEmailTrigger] Gmail watch stopped for workflow ${workflowId}`,
        );
      } catch (error) {
        console.error(
          `[ReceiveEmailTrigger] Error stopping Gmail watch for workflow ${workflowId}:`,
          error,
        );
        // Continue with unregistration even if stop fails
      }
    }

    // Remove the registration
    this.workflowRegistrations.delete(workflowId);

    // Clear watch info from database
    await this.db
      .update(workflows)
      .set({
        gmailHistoryId: null,
        gmailWatchExpiration: null,
        updatedAt: new Date(),
      })
      .where(eq(workflows.id, workflowId));

    console.log(
      `[ReceiveEmailTrigger] Trigger unregistered successfully for workflow ${workflowId}`,
    );
  }

  async validateConfig(config: Record<string, any>): Promise<boolean> {
    // Basic validation - you can add more sophisticated validation here
    if (config.from && typeof config.from !== "string") {
      throw new Error('Invalid "from" field: must be a string');
    }

    if (config.subject && typeof config.subject !== "string") {
      throw new Error('Invalid "subject" field: must be a string');
    }

    if (config.labelIds && !Array.isArray(config.labelIds)) {
      throw new Error('Invalid "labelIds" field: must be an array');
    }

    return true;
  }

  matchesConfig(emailData: any, config: Record<string, any>): boolean {
    if (config.from) {
      const fromPattern = config.from.toLowerCase();
      if (!emailData.from?.toLowerCase().includes(fromPattern)) {
        return false;
      }
    }

    if (config.subject) {
      const subjectPattern = config.subject.toLowerCase();
      if (!emailData.subject?.toLowerCase().includes(subjectPattern)) {
        return false;
      }
    }

    return true;
  }

  getMatchingWorkflows(emailData: any): number[] {
    const matchingWorkflows: number[] = [];

    for (const [
      workflowId,
      registration,
    ] of this.workflowRegistrations.entries()) {
      if (this.matchesConfig(emailData, registration.config)) {
        matchingWorkflows.push(workflowId);
      }
    }

    return matchingWorkflows;
  }
}
