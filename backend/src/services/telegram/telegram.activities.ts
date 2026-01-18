import { Context } from "@temporalio/activity";
import { replaceTemplateVariables } from "../../temporal/activities/utils";

export interface SendTelegramMessageInput {
  botToken: string;
  chatId: string;
  text: string;
  parseMode?: "Markdown" | "MarkdownV2" | "HTML";
  disableWebPagePreview?: boolean;
  disableNotification?: boolean;
  triggerData?: Record<string, any>;
}

export interface SendTelegramMessageOutput {
  delivered: boolean;
  status: number;
  messageId?: number;
  error?: string;
}

export async function sendTelegramMessageActivity(
  input: SendTelegramMessageInput,
): Promise<SendTelegramMessageOutput> {
  const activity = Context.current();
  activity.log.info("Sending Telegram message", {
    chatId: input.chatId,
  });

  let response: Response | undefined;

  try {
    if (!input.botToken) {
      throw new Error("botToken is required");
    }

    if (!input.chatId) {
      throw new Error("chatId is required");
    }

    if (!input.text) {
      throw new Error("text is required");
    }

    const resolvedText = replaceTemplateVariables(
      input.text,
      input.triggerData,
    );

    const payload: Record<string, any> = {
      chat_id: input.chatId,
      text: resolvedText,
    };

    if (input.parseMode) {
      payload.parse_mode = input.parseMode;
    }

    if (typeof input.disableWebPagePreview === "boolean") {
      payload.disable_web_page_preview = input.disableWebPagePreview;
    }

    if (typeof input.disableNotification === "boolean") {
      payload.disable_notification = input.disableNotification;
    }

    response = await fetch(
      `https://api.telegram.org/bot${input.botToken}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    const body = await response.json().catch(() => null);

    if (!response.ok || !body?.ok) {
      const description =
        body?.description ||
        (typeof body?.error === "string" ? body.error : "") ||
        "";
      throw new Error(
        `Telegram sendMessage failed with status ${response.status}${
          description ? `: ${description}` : ""
        }`,
      );
    }

    activity.log.info("Telegram message delivered", {
      status: response.status,
      messageId: body?.result?.message_id,
    });

    return {
      delivered: true,
      status: response.status,
      messageId: body?.result?.message_id,
    };
  } catch (error) {
    activity.log.error("Failed to send Telegram message", {
      error: (error as Error).message,
    });

    return {
      delivered: false,
      status: response?.status ?? 0,
      error: (error as Error).message || "Unknown error",
    };
  }
}

// Helper for Telegram API calls
async function callTelegramApi(method: string, botToken: string, payload: any) {
  const response = await fetch(
    `https://api.telegram.org/bot${botToken}/${method}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );

  const body = await response.json().catch(() => null);

  if (!response.ok || !body?.ok) {
    const description =
      body?.description ||
      (typeof body?.error === "string" ? body.error : "") ||
      "";
    throw new Error(
      `Telegram ${method} failed with status ${response.status}${description ? `: ${description}` : ""}`,
    );
  }

  return { status: response.status, body };
}

// 1. Send Photo
export interface SendTelegramPhotoInput {
  botToken: string;
  chatId: string;
  photo: string; // URL
  caption?: string;
  disableNotification?: boolean;
  triggerData?: Record<string, any>;
}

export async function sendTelegramPhotoActivity(input: SendTelegramPhotoInput) {
  const activity = Context.current();
  try {
    const caption = input.caption
      ? replaceTemplateVariables(input.caption, input.triggerData)
      : undefined;
    const payload: any = {
      chat_id: input.chatId,
      photo: input.photo,
    };
    if (caption) payload.caption = caption;
    if (input.disableNotification) payload.disable_notification = true;

    const res = await callTelegramApi("sendPhoto", input.botToken, payload);
    return {
      delivered: true,
      status: res.status,
      messageId: res.body.result.message_id,
    };
  } catch (error) {
    activity.log.error("Failed to send Telegram photo", {
      error: (error as Error).message,
    });
    throw error;
  }
}

// 2. Pin Message
export interface PinTelegramMessageInput {
  botToken: string;
  chatId: string;
  messageId: string;
  disableNotification?: boolean;
  triggerData?: Record<string, any>;
}

export async function pinTelegramMessageActivity(
  input: PinTelegramMessageInput,
) {
  const activity = Context.current();
  try {
    const messageId = replaceTemplateVariables(
      input.messageId,
      input.triggerData,
    );
    const payload: any = {
      chat_id: input.chatId,
      message_id: messageId,
    };
    if (input.disableNotification) payload.disable_notification = true;

    await callTelegramApi("pinChatMessage", input.botToken, payload);
    return { success: true };
  } catch (error) {
    activity.log.error("Failed to pin Telegram message", {
      error: (error as Error).message,
    });
    throw error;
  }
}

// 3. Kick Member (banChatMember)
export interface KickTelegramMemberInput {
  botToken: string;
  chatId: string;
  userId: string;
  untilDate?: number;
  revokeMessages?: boolean;
  triggerData?: Record<string, any>;
}

export async function kickTelegramMemberActivity(
  input: KickTelegramMemberInput,
) {
  const activity = Context.current();
  try {
    const userId = replaceTemplateVariables(input.userId, input.triggerData);
    const payload: any = {
      chat_id: input.chatId,
      user_id: userId,
    };
    if (input.untilDate) payload.until_date = input.untilDate;
    if (input.revokeMessages) payload.revoke_messages = input.revokeMessages;

    await callTelegramApi("banChatMember", input.botToken, payload);
    return { success: true };
  } catch (error) {
    activity.log.error("Failed to kick Telegram member", {
      error: (error as Error).message,
    });
    throw error;
  }
}

// 4. Unban Member (unbanChatMember)
export interface UnbanTelegramMemberInput {
  botToken: string;
  chatId: string;
  userId: string;
  onlyIfBanned?: boolean;
  triggerData?: Record<string, any>;
}

export async function unbanTelegramMemberActivity(
  input: UnbanTelegramMemberInput,
) {
  const activity = Context.current();
  try {
    const userId = replaceTemplateVariables(input.userId, input.triggerData);
    const payload: any = {
      chat_id: input.chatId,
      user_id: userId,
    };
    if (input.onlyIfBanned) payload.only_if_banned = true;

    await callTelegramApi("unbanChatMember", input.botToken, payload);
    return { success: true };
  } catch (error) {
    activity.log.error("Failed to unban Telegram member", {
      error: (error as Error).message,
    });
    throw error;
  }
}
