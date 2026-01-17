import { Context } from "@temporalio/activity";
import { google } from "googleapis";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import * as schema from "../../db/schema";
import { GmailClient } from "./gmail-client";
import { replaceTemplateVariables } from "../../temporal/activities/utils";

const connectionString = `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_NAME}`;
const queryClient = postgres(connectionString);
const db = drizzle(queryClient, { schema });

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

async function ensureFreshAccessToken(credential: {
  id: number;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: Date | null;
  clientId: string | null;
  clientSecret: string | null;
}) {
  if (!credential.accessToken) {
    throw new Error("Missing access token");
  }

  const expiresAt = credential.expiresAt?.getTime() || 0;
  const needsRefresh = expiresAt > 0 && expiresAt <= Date.now() + 60_000;

  if (!needsRefresh) {
    return credential;
  }

  if (
    !credential.refreshToken ||
    !credential.clientId ||
    !credential.clientSecret
  ) {
    throw new Error("Missing OAuth2 refresh credentials");
  }

  const oauth2Client = new google.auth.OAuth2(
    credential.clientId,
    credential.clientSecret,
  );
  oauth2Client.setCredentials({ refresh_token: credential.refreshToken });

  const { credentials: newTokens } = await oauth2Client.refreshAccessToken();
  const newExpiresAt = newTokens.expiry_date
    ? new Date(newTokens.expiry_date)
    : null;

  await db
    .update(schema.credentials)
    .set({
      accessToken: newTokens.access_token || credential.accessToken,
      refreshToken: newTokens.refresh_token || credential.refreshToken,
      expiresAt: newExpiresAt,
      isValid: true,
      updatedAt: new Date(),
    })
    .where(eq(schema.credentials.id, credential.id));

  return {
    ...credential,
    accessToken: newTokens.access_token || credential.accessToken,
    refreshToken: newTokens.refresh_token || credential.refreshToken,
    expiresAt: newExpiresAt,
  };
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

export async function sendEmailActivity(
  input: SendEmailInput,
): Promise<SendEmailOutput> {
  const activity = Context.current();
  activity.log.info("Sending email", { to: input.to, subject: input.subject });

  try {
    const loaded = await loadCredentials(input.credentialId, input.userId);
    const credential = await ensureFreshAccessToken(loaded);

    const gmailCredentials = {
      data: {
        accessToken: credential.accessToken,
        refreshToken: credential.refreshToken,
        expiresAt: credential.expiresAt
          ? new Date(credential.expiresAt).getTime()
          : undefined,
      },
      clientId: credential.clientId || undefined,
      clientSecret: credential.clientSecret || undefined,
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
    activity.log.error("Failed to send email", { error: (error as Error).message });

    return {
      messageId: "",
      threadId: "",
      success: false,
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
    const loaded = await loadCredentials(input.credentialId, input.userId);
    const credential = await ensureFreshAccessToken(loaded);

    const gmailCredentials = {
      data: {
        accessToken: credential.accessToken,
        refreshToken: credential.refreshToken,
        expiresAt: credential.expiresAt
          ? new Date(credential.expiresAt).getTime()
          : undefined,
      },
      clientId: credential.clientId || undefined,
      clientSecret: credential.clientSecret || undefined,
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
    activity.log.error("Failed to read emails", { error: (error as Error).message });

    return {
      messages: [],
      totalCount: 0,
      success: false,
      error: (error as Error).message || "Unknown error",
    };
  }
}
