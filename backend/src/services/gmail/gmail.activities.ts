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

  if (!credential) throw new Error("Credentials not found");
  if (credential.userId !== userId) throw new Error("Unauthorized");
  return credential;
}

async function ensureFreshAccessToken(credential: any) {
  if (!credential.accessToken) throw new Error("Missing access token");
  const expiresAt = credential.expiresAt?.getTime() || 0;
  if (expiresAt > 0 && expiresAt <= Date.now() + 60_000) {
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
      accessToken: newTokens.access_token,
      refreshToken: newTokens.refresh_token,
      expiresAt: newExpiresAt,
    };
  }
  return credential;
}

async function getClient(credentialId: number, userId: string) {
  const loaded = await loadCredentials(credentialId, userId);
  const credential = await ensureFreshAccessToken(loaded);
  return new GmailClient({
    data: {
      accessToken: credential.accessToken,
      refreshToken: credential.refreshToken,
      expiresAt: credential.expiresAt
        ? new Date(credential.expiresAt).getTime()
        : undefined,
    },
    clientId: credential.clientId || undefined,
    clientSecret: credential.clientSecret || undefined,
  });
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

export async function sendEmailActivity(input: SendEmailInput) {
  const client = await getClient(input.credentialId, input.userId);

  const result = await client.sendEmail({
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
  });

  return { messageId: result.messageId, threadId: result.threadId };
}

export interface ReadEmailInput {
  query?: string;
  maxResults?: number;
  labelIds?: string[];
  credentialId: number;
  userId: string;
}

export async function readEmailActivity(input: ReadEmailInput) {
  const client = await getClient(input.credentialId, input.userId);
  const result = await client.readEmails(
    input.query,
    input.maxResults,
    input.labelIds,
  );
  return { messages: result.messages, totalCount: result.totalCount };
}
