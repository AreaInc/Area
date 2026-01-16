import { Context } from "@temporalio/activity";
import { replaceTemplateVariables } from "../../temporal/activities/utils";

export interface SendDiscordWebhookInput {
  webhookUrl: string;
  content: string;
  triggerData?: Record<string, any>;
}

export interface SendDiscordWebhookOutput {
  delivered: boolean;
  status: number;
  error?: string;
}

export async function sendDiscordWebhookActivity(
  input: SendDiscordWebhookInput,
): Promise<SendDiscordWebhookOutput> {
  const activity = Context.current();
  activity.log.info("Sending Discord webhook", {
    webhookUrl: input.webhookUrl,
  });

  let response: Response | undefined;

  try {
    if (!input.webhookUrl) {
      throw new Error("webhookUrl is required");
    }

    if (!input.content) {
      throw new Error("content is required");
    }

    const resolvedContent = replaceTemplateVariables(
      input.content,
      input.triggerData,
    );

    response = await fetch(input.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content: resolvedContent }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(
        `Discord webhook failed with status ${response.status}${
          errorText ? `: ${errorText}` : ""
        }`,
      );
    }

    activity.log.info("Discord webhook delivered", {
      status: response.status,
    });

    return {
      delivered: true,
      status: response.status,
    };
  } catch (error) {
    activity.log.error("Failed to send Discord webhook", {
      error: (error as Error).message,
    });

    return {
      delivered: false,
      status: response?.status ?? 0,
      error: (error as Error).message || "Unknown error",
    };
  }
}
