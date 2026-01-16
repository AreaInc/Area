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
