import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../../db/schema";
import { eq } from "drizzle-orm";
import { GmailClient } from "../../services/gmail/gmail-client";
import { Context } from "@temporalio/activity";

const connectionString = `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_NAME}`;
const queryClient = postgres(connectionString);
const db = drizzle(queryClient, { schema });

function replaceTemplateVariables(
  template: string,
  data?: Record<string, any>,
): string {
  if (!data) return template;

  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key]?.toString() || match;
  });
}

async function loadCredentials(credentialId: number, userId: string) {
  const [credential] = await db
    .select()
    .from(schema.credentials)
    .where(eq(schema.credentials.id, credentialId));

  if (!credential) {
    throw new Error("Credentials not found");
  }

  if (credential.userId !== userId) {
    throw new Error("Unauthorized: Credentials do not belong to user");
  }

  return credential;
}

export interface SendEmailInput {
  to: string;
  subject: string;
  body: string;
  cc?: string[];
  bcc?: string[];
  isHtml?: boolean;
  credentialId: number;
  userId: string;
  triggerData?: Record<string, any>;
}

export interface SendEmailOutput {
  messageId: string;
  threadId: string;
  success: boolean;
  error?: string;
}

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

export async function sendEmailActivity(
  input: SendEmailInput,
): Promise<SendEmailOutput> {
  const activity = Context.current();
  activity.log.info("Sending email", { to: input.to, subject: input.subject });

  try {
    const credential = await loadCredentials(input.credentialId, input.userId);

    const gmailCredentials = {
      data: {
        accessToken: credential.accessToken,
        refreshToken: credential.refreshToken,
        expiresAt: credential.expiresAt
          ? new Date(credential.expiresAt).getTime()
          : undefined,
      },
    };

    const gmailClient = new GmailClient(gmailCredentials as any);

    const emailParams = {
      to: replaceTemplateVariables(input.to, input.triggerData),
      subject: replaceTemplateVariables(input.subject, input.triggerData),
      body: replaceTemplateVariables(input.body, input.triggerData),
      cc: input.cc?.map((email) =>
        replaceTemplateVariables(email, input.triggerData),
      ),
      bcc: input.bcc?.map((email) =>
        replaceTemplateVariables(email, input.triggerData),
      ),
      isHtml: input.isHtml,
    };

    const result = await gmailClient.sendEmail(emailParams);

    activity.log.info("Email sent successfully", {
      messageId: result.messageId,
      threadId: result.threadId,
    });

    return {
      messageId: result.messageId,
      threadId: result.threadId,
      success: true,
    };
  } catch (error) {
    activity.log.error("Failed to send email", { error: error.message });

    return {
      messageId: "",
      threadId: "",
      success: false,
      error: error.message || "Unknown error",
    };
  }
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

export interface ReadEmailInput {
  query?: string;
  maxResults?: number;
  labelIds?: string[];
  credentialId: number;
  userId: string;
}

export interface ReadEmailOutput {
  messages: Array<{
    id: string;
    threadId: string;
    snippet: string;
    from: string;
    to: string;
    subject: string;
    date: string;
  }>;
  totalCount: number;
  success: boolean;
  error?: string;
}

export async function readEmailActivity(
  input: ReadEmailInput,
): Promise<ReadEmailOutput> {
  const activity = Context.current();
  activity.log.info("Reading emails", {
    query: input.query,
    maxResults: input.maxResults,
  });

  try {
    const credential = await loadCredentials(input.credentialId, input.userId);

    const gmailCredentials = {
      data: {
        accessToken: credential.accessToken,
        refreshToken: credential.refreshToken,
        expiresAt: credential.expiresAt
          ? new Date(credential.expiresAt).getTime()
          : undefined,
      },
    };

    const gmailClient = new GmailClient(gmailCredentials as any);

    const { messages: messageList } = await gmailClient.listMessages({
      query: input.query,
      maxResults: input.maxResults || 10,
      labelIds: input.labelIds,
    });

    const messages = await Promise.all(
      messageList.slice(0, input.maxResults || 10).map(async (msg) => {
        if (!msg.id) return null;

        const fullMessage = await gmailClient.getMessage(msg.id);
        const details = gmailClient.getMessageDetails(fullMessage);

        return {
          id: details.id,
          threadId: details.threadId,
          snippet: details.snippet,
          from: details.from,
          to: details.to,
          subject: details.subject,
          date: details.date,
        };
      }),
    );

    const validMessages = messages.filter((msg) => msg !== null);

    activity.log.info("Emails read successfully", {
      count: validMessages.length,
    });

    return {
      messages: validMessages,
      totalCount: validMessages.length,
      success: true,
    };
  } catch (error) {
    activity.log.error("Failed to read emails", { error: error.message });

    return {
      messages: [],
      totalCount: 0,
      success: false,
      error: error.message || "Unknown error",
    };
  }
}
