import { proxyActivities, log } from "@temporalio/workflow";
import type * as activities from "../activities";

const {
  sendEmailActivity,
  readEmailActivity,
  sendDiscordWebhookActivity,
  sendTelegramMessageActivity,
  createSpreadsheetActivity,
  addRowActivity,
  updateCellActivity,
  readRangeActivity,
  createSheetActivity,
  clearRangeActivity,
  duplicateSheetActivity,
  findReplaceActivity,
  sortRangeActivity,
  playMusicActivity,
  addToPlaylistActivity,
  createSpotifyPlaylistActivity,
  skipTrackActivity,
  pausePlaybackActivity,
  likeCurrentTrackActivity,
  updateStreamTitleActivity,
  updateStreamGameActivity,
  sendChatMessageActivity,
  createClipActivity,
  startCommercialActivity,
  createStreamMarkerActivity,
  createPlaylistActivity,
  deletePlaylistActivity,
  rateVideoActivity,
  subscribeChannelActivity,
  unsubscribeChannelActivity,
  commentVideoActivity,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: "5 minutes",
  retry: {
    initialInterval: "1s",
    backoffCoefficient: 2,
    maximumAttempts: 3,
  },
});

export interface AutomationWorkflowInput {
  workflowId: number;
  userId: string;

  triggerProvider: string;
  triggerId: string;
  triggerData: Record<string, any>;

  actionProvider: string;
  actionId: string;
  actionConfig: Record<string, any>;
  actionCredentialsId?: number;
}

export interface AutomationWorkflowOutput {
  success: boolean;
  actionResult: any;
  error?: string;
}

export async function automationWorkflow(
  input: AutomationWorkflowInput,
): Promise<AutomationWorkflowOutput> {
  log.info("Starting automation workflow", {
    workflowId: input.workflowId,
    trigger: `${input.triggerProvider}:${input.triggerId}`,
    action: `${input.actionProvider}:${input.actionId}`,
  });

  try {
    const activityKey = `${input.actionProvider}:${input.actionId}`;

    let actionResult: any;

    switch (activityKey) {
      case "gmail:send-email":
        if (!input.actionCredentialsId) {
          throw new Error("Credentials required for send-email action");
        }

        actionResult = await sendEmailActivity({
          ...input.actionConfig,
          credentialId: input.actionCredentialsId,
          userId: input.userId,
          triggerData: input.triggerData,
        } as any);
        break;

      case "gmail:read-email":
        if (!input.actionCredentialsId) {
          throw new Error("Credentials required for read-email action");
        }

        actionResult = await readEmailActivity({
          ...input.actionConfig,
          credentialId: input.actionCredentialsId,
          userId: input.userId,
        });
        break;

      case "discord:send-webhook":
        actionResult = await sendDiscordWebhookActivity({
          webhookUrl: input.actionConfig.webhookUrl,
          content: input.actionConfig.content,
          triggerData: input.triggerData,
        });
        break;

      case "telegram:send-message":
        actionResult = await sendTelegramMessageActivity({
          botToken: input.actionConfig.botToken,
          chatId: input.actionConfig.chatId,
          text: input.actionConfig.text,
          parseMode: input.actionConfig.parseMode,
          disableWebPagePreview: input.actionConfig.disableWebPagePreview,
          disableNotification: input.actionConfig.disableNotification,
          triggerData: input.triggerData,
        });
        break;

      case "google_sheets:create_spreadsheet":
        if (!input.actionCredentialsId) throw new Error("Credentials required");
        actionResult = await createSpreadsheetActivity({
          title: input.actionConfig.title,
          credentialId: input.actionCredentialsId,
          userId: input.userId,
        });
        break;

      case "google_sheets:add_row":
        if (!input.actionCredentialsId) throw new Error("Credentials required");
        actionResult = await addRowActivity({
          spreadsheetId: input.actionConfig.spreadsheetId,
          sheetName: input.actionConfig.sheetName,
          values: input.actionConfig.values,
          credentialId: input.actionCredentialsId,
          userId: input.userId,
        });
        break;

      case "google_sheets:write_in_cell":
        if (!input.actionCredentialsId) throw new Error("Credentials required");
        actionResult = await updateCellActivity({
          spreadsheetId: input.actionConfig.spreadsheetId,
          range: input.actionConfig.range,
          value: input.actionConfig.value,
          credentialId: input.actionCredentialsId,
          userId: input.userId,
        });
        break;

      case "google_sheets:read_in_range":
        if (!input.actionCredentialsId) throw new Error("Credentials required");
        actionResult = await readRangeActivity({
          spreadsheetId: input.actionConfig.spreadsheetId,
          range: input.actionConfig.range,
          credentialId: input.actionCredentialsId,
          userId: input.userId,
        });
        break;

      case "google_sheets:create_sheet":
        if (!input.actionCredentialsId) throw new Error("Credentials required");
        actionResult = await createSheetActivity({
          spreadsheetId: input.actionConfig.spreadsheetId,
          sheetTitle: input.actionConfig.sheetTitle,
          credentialId: input.actionCredentialsId,
          userId: input.userId,
        });
        break;

      case "google_sheets:clear_in_range":
        if (!input.actionCredentialsId) throw new Error("Credentials required");
        actionResult = await clearRangeActivity({
          spreadsheetId: input.actionConfig.spreadsheetId,
          range: input.actionConfig.range,
          credentialId: input.actionCredentialsId,
          userId: input.userId,
        });
        break;

      case "google_sheets:duplicate_sheet":
        if (!input.actionCredentialsId) throw new Error("Credentials required");
        actionResult = await duplicateSheetActivity({
          spreadsheetId: input.actionConfig.spreadsheetId,
          newTitle: input.actionConfig.newTitle,
          credentialId: input.actionCredentialsId,
          userId: input.userId,
        });
        break;

      case "google_sheets:find_to_replace":
        if (!input.actionCredentialsId) throw new Error("Credentials required");
        actionResult = await findReplaceActivity({
          spreadsheetId: input.actionConfig.spreadsheetId,
          find: input.actionConfig.find,
          replacement: input.actionConfig.replacement,
          sheetId: input.actionConfig.sheetId,
          credentialId: input.actionCredentialsId,
          userId: input.userId,
        });
        break;

      case "google_sheets:sort_data_in_range":
        if (!input.actionCredentialsId) throw new Error("Credentials required");
        actionResult = await sortRangeActivity({
          spreadsheetId: input.actionConfig.spreadsheetId,
          range: input.actionConfig.range,
          sortColumn: input.actionConfig.sortColumn,
          ascending: input.actionConfig.ascending,
          credentialId: input.actionCredentialsId,
          userId: input.userId,
        });
        break;

      case "spotify:play_music":
        if (!input.actionCredentialsId) throw new Error("Credentials required");
        actionResult = await playMusicActivity({
          trackUri: input.actionConfig.trackUri,
          credentialId: input.actionCredentialsId,
          userId: input.userId,
        });
        break;

      case "spotify:add_to_playlist":
        if (!input.actionCredentialsId) throw new Error("Credentials required");
        actionResult = await addToPlaylistActivity({
          playlistId: input.actionConfig.playlistId,
          trackUri: input.actionConfig.trackUri,
          credentialId: input.actionCredentialsId,
          userId: input.userId,
        });
        break;

      case "spotify:create_playlist":
        if (!input.actionCredentialsId) throw new Error("Credentials required");
        actionResult = await createSpotifyPlaylistActivity({
          name: input.actionConfig.name,
          description: input.actionConfig.description,
          credentialId: input.actionCredentialsId,
          userId: input.userId,
        });
        break;

      case "spotify:skip_track":
        if (!input.actionCredentialsId) throw new Error("Credentials required");
        actionResult = await skipTrackActivity({
          credentialId: input.actionCredentialsId,
          userId: input.userId,
        });
        break;

      case "spotify:pause_playback":
        if (!input.actionCredentialsId) throw new Error("Credentials required");
        actionResult = await pausePlaybackActivity({
          credentialId: input.actionCredentialsId,
          userId: input.userId,
        });
        break;

      case "spotify:like_current_track":
        if (!input.actionCredentialsId) throw new Error("Credentials required");
        actionResult = await likeCurrentTrackActivity({
          credentialId: input.actionCredentialsId,
          userId: input.userId,
        });
        break;

      case "twitch:update_stream_title":
        if (!input.actionCredentialsId) throw new Error("Credentials required");
        actionResult = await updateStreamTitleActivity({
          title: input.actionConfig.title,
          credentialId: input.actionCredentialsId,
          userId: input.userId,
        });
        break;

      case "twitch:update_stream_game":
        if (!input.actionCredentialsId) throw new Error("Credentials required");
        actionResult = await updateStreamGameActivity({
          gameName: input.actionConfig.gameName,
          credentialId: input.actionCredentialsId,
          userId: input.userId,
        });
        break;

      case "twitch:send_chat_message":
        if (!input.actionCredentialsId) throw new Error("Credentials required");
        actionResult = await sendChatMessageActivity({
          message: input.actionConfig.message,
          credentialId: input.actionCredentialsId,
          userId: input.userId,
        });
        break;

      case "twitch:create_clip":
        if (!input.actionCredentialsId) throw new Error("Credentials required");
        actionResult = await createClipActivity({
          hasDelay: input.actionConfig.hasDelay,
          credentialId: input.actionCredentialsId,
          userId: input.userId,
        });
        break;

      case "twitch:start_commercial":
        if (!input.actionCredentialsId) throw new Error("Credentials required");
        actionResult = await startCommercialActivity({
          length: input.actionConfig.length,
          credentialId: input.actionCredentialsId,
          userId: input.userId,
        });
        break;

      case "twitch:create_stream_marker":
        if (!input.actionCredentialsId) throw new Error("Credentials required");
        actionResult = await createStreamMarkerActivity({
          description: input.actionConfig.description,
          credentialId: input.actionCredentialsId,
          userId: input.userId,
        });
        break;

      case "youtube:create_playlist":
        if (!input.actionCredentialsId) throw new Error("Credentials required");
        actionResult = await createPlaylistActivity({
          title: input.actionConfig.title,
          description: input.actionConfig.description,
          credentialId: input.actionCredentialsId,
          userId: input.userId,
        });
        break;

      case "youtube:delete_playlist":
        if (!input.actionCredentialsId) throw new Error("Credentials required");
        actionResult = await deletePlaylistActivity({
          playlistName: input.actionConfig.playlistName,
          credentialId: input.actionCredentialsId,
          userId: input.userId,
        });
        break;

      case "youtube:rate_video":
        if (!input.actionCredentialsId) throw new Error("Credentials required");
        actionResult = await rateVideoActivity({
          videoId: input.actionConfig.videoId,
          rating: input.actionConfig.rating,
          credentialId: input.actionCredentialsId,
          userId: input.userId,
        });
        break;

      case "youtube:subscribe_channel":
        if (!input.actionCredentialsId) throw new Error("Credentials required");
        actionResult = await subscribeChannelActivity({
          channelName: input.actionConfig.channelName,
          credentialId: input.actionCredentialsId,
          userId: input.userId,
        });
        break;

      case "youtube:unsubscribe_channel":
        if (!input.actionCredentialsId) throw new Error("Credentials required");
        actionResult = await unsubscribeChannelActivity({
          channelName: input.actionConfig.channelName,
          credentialId: input.actionCredentialsId,
          userId: input.userId,
        });
        break;

      case "youtube:comment_video":
        if (!input.actionCredentialsId) throw new Error("Credentials required");
        actionResult = await commentVideoActivity({
          videoId: input.actionConfig.videoId,
          comment: input.actionConfig.comment,
          credentialId: input.actionCredentialsId,
          userId: input.userId,
        });
        break;

      default:
        throw new Error(`Unsupported action: ${activityKey}`);
    }

    log.info("Automation workflow completed successfully", {
      workflowId: input.workflowId,
      actionResult,
    });

    return {
      success: true,
      actionResult,
    };
  } catch (error) {
    log.error("Automation workflow failed", {
      workflowId: input.workflowId,
      error: error.message,
    });

    return {
      success: false,
      actionResult: null,
      error: error.message || "Unknown error",
    };
  }
}
