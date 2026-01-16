export {
  sendEmailActivity,
  readEmailActivity,
} from "../../services/gmail/gmail.activities";
export type {
  SendEmailInput,
  SendEmailOutput,
  ReadEmailInput,
  ReadEmailOutput,
} from "../../services/gmail/gmail.activities";

export { sendDiscordWebhookActivity } from "../../services/discord/discord.activities";
export type {
  SendDiscordWebhookInput,
  SendDiscordWebhookOutput,
} from "../../services/discord/discord.activities";

export { sendTelegramMessageActivity } from "../../services/telegram/telegram.activities";
export type {
  SendTelegramMessageInput,
  SendTelegramMessageOutput,
} from "../../services/telegram/telegram.activities";
