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
