import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
  Inject,
} from "@nestjs/common";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { DRIZZLE } from "../../db/drizzle.module";
import * as schema from "../../db/schema";
import { workflows } from "../../db/schema";
import { eq, and } from "drizzle-orm";
import { WorkflowsService } from "../workflows/workflows.service";
import { TriggerRegistryService } from "../registries/trigger-registry.service";

// Define interfaces for Telegram updates
interface TelegramUpdate {
  update_id: number;
  message?: any;
  channel_post?: any;
  edited_message?: any;
  edited_channel_post?: any;
}

@Injectable()
export class TelegramPollingService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramPollingService.name);
  private readonly pollIntervalMs = 2000;
  private isPolling = false;
  private isProcessing = false;
  private pollingIntervalId: NodeJS.Timeout | null = null;

  // Store offsets for each bot token: token -> last_update_id
  private offsets = new Map<string, number>();

  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly workflowsService: WorkflowsService,
    private readonly triggerRegistry: TriggerRegistryService,
  ) {}

  async onModuleInit() {
    this.startPolling();
  }

  onModuleDestroy() {
    this.stopPolling();
  }

  startPolling() {
    if (this.isPolling) return;
    this.isPolling = true;
    this.logger.log(
      `Starting Telegram polling (interval: ${this.pollIntervalMs}ms)`,
    );

    this.pollingIntervalId = setInterval(async () => {
      if (this.isPolling && !this.isProcessing) {
        this.isProcessing = true;
        try {
          await this.poll();
        } finally {
          this.isProcessing = false;
        }
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

  private async poll() {
    try {
      // 1. Get all active Telegram triggers from DB
      const activeWorkflows = await this.db
        .select()
        .from(workflows)
        .where(
          and(
            eq(workflows.triggerProvider, "telegram"),
            eq(workflows.isActive, true),
          ),
        );

      if (activeWorkflows.length === 0) return;

      // 2. Group workflows by bot token
      const workflowsByToken = new Map<string, typeof activeWorkflows>();

      for (const wf of activeWorkflows) {
        const config = wf.triggerConfig as any;
        const token = config?.botToken;
        if (!token) continue;

        if (!workflowsByToken.has(token)) {
          workflowsByToken.set(token, []);
        }
        workflowsByToken.get(token)!.push(wf);
      }

      // 3. Poll each token
      await Promise.all(
        Array.from(workflowsByToken.entries()).map(async ([token, wfs]) => {
          await this.pollToken(token, wfs);
        }),
      );
    } catch (error) {
      this.logger.error("Error in Telegram polling loop", error);
    }
  }

  private async pollToken(token: string, wfs: any[]) {
    try {
      const offset = this.offsets.get(token) || 0;

      // Call getUpdates
      const url = `https://api.telegram.org/bot${token}/getUpdates?offset=${offset + 1}&timeout=0`;
      const response = await fetch(url);

      if (!response.ok) {
        // If 401/404, maybe invalid token. Log and skip.
        if (
          response.status === 401 ||
          response.status === 403 ||
          response.status === 404
        ) {
          this.logger.warn(
            `Invalid Telegram token ${token.slice(0, 5)}...: ${response.statusText}`,
          );
          return;
        }
        throw new Error(
          `Telegram API error: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();
      if (!data.ok || !Array.isArray(data.result)) return;

      const updates: TelegramUpdate[] = data.result;
      if (updates.length === 0) return;

      // Process updates
      let maxUpdateId = offset;

      for (const update of updates) {
        if (update.update_id > maxUpdateId) {
          maxUpdateId = update.update_id;
        }

        // Identify the message object (could be message, channel_post, etc.)
        let message = update.message || update.channel_post;
        let isEdit = false;

        if (!message) {
          message = update.edited_message || update.edited_channel_post;
          isEdit = true;
        }

        if (!message) continue;

        // Determine triggers to fire
        await this.processMessage(token, message, wfs, isEdit);
      }

      // Update offset
      this.offsets.set(token, maxUpdateId);
    } catch (error) {
      this.logger.error(`Error polling token ${token.slice(0, 5)}...`, error);
    }
  }

  private async processMessage(
    token: string,
    message: any,
    wfs: any[],
    isEdit: boolean = false,
  ) {
    // We have a list of workflows interested in this token.
    // We iterate through them and check if the message matches their trigger criteria.

    for (const wf of wfs) {
      const config = wf.triggerConfig;

      if (isEdit) {
        // 9. On Message Edited
        if (wf.triggerId === "on-message-edited") {
          await this.workflowsService.triggerWorkflowExecution(wf.id, {
            messageId: message.message_id,
            chatId: message.chat.id,
            userId: message.from?.id,
            username: message.from?.username,
            text: message.text || message.caption, // caption for media
            editDate: new Date(message.edit_date * 1000).toISOString(),
          });
        }
        // Skip other triggers for edits
        continue;
      }

      // Standard triggers (non-edit)

      // 1. On Message (any text or specific regex)
      if (wf.triggerId === "on-message") {
        if (message.text) {
          let match = true;
          if (config.matchText) {
            const regex = new RegExp(config.matchText);
            if (!regex.test(message.text)) match = false;
          }

          if (match) {
            await this.workflowsService.triggerWorkflowExecution(wf.id, {
              messageId: message.message_id,
              chatId: message.chat.id,
              userId: message.from?.id,
              username: message.from?.username,
              text: message.text,
              date: new Date(message.date * 1000).toISOString(),
            });
          }
        }
      }

      // 2. On Command
      if (wf.triggerId === "on-command") {
        if (message.text && config.command) {
          // Normalize command (e.g. "start" -> "/start")
          const cmd = config.command.startsWith("/")
            ? config.command
            : "/" + config.command;
          if (message.text.startsWith(cmd)) {
            await this.workflowsService.triggerWorkflowExecution(wf.id, {
              messageId: message.message_id,
              chatId: message.chat.id,
              userId: message.from?.id,
              username: message.from?.username,
              command: cmd,
              args: message.text.slice(cmd.length).trim(),
              date: new Date(message.date * 1000).toISOString(),
            });
          }
        }
      }

      // 3. On Pinned Message
      if (wf.triggerId === "on-pinned-message") {
        if (message.pinned_message) {
          this.logger.log(`Firing on-pinned-message for workflow ${wf.id}`);
          await this.workflowsService.triggerWorkflowExecution(wf.id, {
            messageId: message.message_id, // The service message ID
            chatId: message.chat.id,
            pinnedMessageId: message.pinned_message.message_id,
            pinnedText: message.pinned_message.text,
            pinnerUserId: message.from?.id,
            date: new Date(message.date * 1000).toISOString(),
          });
        }
      }

      // 4. On New Member
      if (wf.triggerId === "on-new-member") {
        if (
          message.new_chat_members &&
          Array.isArray(message.new_chat_members)
        ) {
          this.logger.log(
            `Firing on-new-member for workflow ${wf.id} - members: ${message.new_chat_members.length}`,
          );
          for (const member of message.new_chat_members) {
            try {
              await this.workflowsService.triggerWorkflowExecution(wf.id, {
                messageId: message.message_id,
                chatId: message.chat.id,
                newUserId: member.id,
                newUsername: member.username,
                inviterUserId: message.from?.id,
                date: new Date(message.date * 1000).toISOString(),
              });
            } catch (e) {
              this.logger.error(
                `Failed to trigger workflow ${wf.id} for new member`,
                e,
              );
            }
          }
        }
      }

      // 5. On Reply Message
      if (wf.triggerId === "on-reply-message") {
        if (message.reply_to_message) {
          await this.workflowsService.triggerWorkflowExecution(wf.id, {
            messageId: message.message_id,
            chatId: message.chat.id,
            userId: message.from?.id,
            text: message.text,
            replyToMessageId: message.reply_to_message.message_id,
            replyToText: message.reply_to_message.text,
            replyToUserId: message.reply_to_message.from?.id,
            date: new Date(message.date * 1000).toISOString(),
          });
        }
      }

      // 6. On Voice Message
      if (wf.triggerId === "on-voice-message") {
        if (message.voice) {
          await this.workflowsService.triggerWorkflowExecution(wf.id, {
            messageId: message.message_id,
            chatId: message.chat.id,
            userId: message.from?.id,
            duration: message.voice.duration,
            mimeType: message.voice.mime_type,
            fileId: message.voice.file_id,
            date: new Date(message.date * 1000).toISOString(),
          });
        }
      }

      // 7. On Video Message
      if (wf.triggerId === "on-video-message") {
        // Check for video or video_note (circle video)
        const video = message.video || message.video_note;
        if (video) {
          await this.workflowsService.triggerWorkflowExecution(wf.id, {
            messageId: message.message_id,
            chatId: message.chat.id,
            userId: message.from?.id,
            duration: video.duration,
            mimeType: video.mime_type || "video/mp4", // video_note might not have mime_type
            fileId: video.file_id,
            isVideoNote: !!message.video_note,
            date: new Date(message.date * 1000).toISOString(),
          });
        }
      }

      // 8. On Start DM (First Interaction)
      if (wf.triggerId === "on-start-dm") {
        if (message.text === "/start" && message.chat.type === "private") {
          await this.workflowsService.triggerWorkflowExecution(wf.id, {
            messageId: message.message_id,
            chatId: message.chat.id,
            userId: message.from?.id,
            username: message.from?.username,
            firstName: message.from?.first_name,
            date: new Date(message.date * 1000).toISOString(),
          });
        }
      }
    }
  }
}
