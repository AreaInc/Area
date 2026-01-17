export { sendEmailActivity, readEmailActivity } from "../../services/gmail/gmail.activities";
export type { SendEmailInput, SendEmailOutput, ReadEmailInput, ReadEmailOutput } from "../../services/gmail/gmail.activities";

export { sendDiscordWebhookActivity } from "../../services/discord/discord.activities";
export type { SendDiscordWebhookInput, SendDiscordWebhookOutput } from "../../services/discord/discord.activities";

export {
  sendTelegramMessageActivity,
  sendTelegramPhotoActivity,
  pinTelegramMessageActivity,
  kickTelegramMemberActivity,
  unbanTelegramMemberActivity,
} from "../../services/telegram/telegram.activities";
export type {
  SendTelegramMessageInput, SendTelegramMessageOutput,
  SendTelegramPhotoInput,
  PinTelegramMessageInput,
  KickTelegramMemberInput,
  UnbanTelegramMemberInput,
} from "../../services/telegram/telegram.activities";

export {
  createSpreadsheetActivity,
  addRowActivity,
  updateCellActivity,
  readRangeActivity,
  createSheetActivity,
  clearRangeActivity,
  duplicateSheetActivity,
  findReplaceActivity,
  sortRangeActivity,
} from "../../services/google-sheets/google-sheets.activities";

export type {
  CreateSpreadsheetInput, AddRowInput,
  UpdateCellInput, ReadRangeInput,
  CreateSheetInput, ClearRangeInput,
  DuplicateSheetInput, FindReplaceInput,
  SortRangeInput
} from "../../services/google-sheets/google-sheets.activities";

export {
  playMusicActivity,
  addToPlaylistActivity,
  createSpotifyPlaylistActivity,
  skipTrackActivity,
  pausePlaybackActivity,
  likeCurrentTrackActivity,
} from "../../services/spotify/spotify.activities";

export type {
  PlayMusicInput,
  AddToPlaylistInput,
  CreatePlaylistInput,
  SkipTrackInput,
  PausePlaybackInput,
  LikeCurrentTrackInput,
} from "../../services/spotify/spotify.activities";

export {
  updateStreamTitleActivity,
  updateStreamGameActivity,
  sendChatMessageActivity,
  createClipActivity,
  startCommercialActivity,
  createStreamMarkerActivity,
} from "../../services/twitch/twitch.activities";

export type {
  UpdateStreamTitleInput,
  UpdateStreamGameInput,
  SendChatMessageInput,
  CreateClipInput,
  StartCommercialInput,
  CreateStreamMarkerInput,
} from "../../services/twitch/twitch.activities";

export {
  createPlaylistActivity,
  deletePlaylistActivity,
  rateVideoActivity,
  subscribeChannelActivity,
  unsubscribeChannelActivity,
  commentVideoActivity,
} from "../../services/youtube/youtube.activities";

export type {
  CreatePlaylistInput as YouTubeCreatePlaylistInput,
  DeletePlaylistInput as YouTubeDeletePlaylistInput,
  RateVideoInput,
  SubscribeChannelInput,
  UnsubscribeChannelInput,
  CommentVideoInput,
} from "../../services/youtube/youtube.activities";




