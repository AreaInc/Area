/**
 * Temporal Activities Entry Point
 *
 * This file exports all Temporal activities with dependency injection.
 * Activities need access to database and services, so we create them
 * with a factory function that injects dependencies.
 */

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../../db/schema';
import { eq } from 'drizzle-orm';
import { GmailClient } from '../../services/gmail/gmail-client';
import { Context } from '@temporalio/activity';

// Create database connection for activities
const connectionString = `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_NAME}`;
const queryClient = postgres(connectionString);
const db = drizzle(queryClient, { schema });

/**
 * Template variable replacement utility
 */
function replaceTemplateVariables(
  template: string,
  data?: Record<string, any>,
): string {
  if (!data) return template;

  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key]?.toString() || match;
  });
}

/**
 * Load credentials from database
 */
async function loadCredentials(credentialId: number, userId: string) {
  const [credential] = await db
    .select()
    .from(schema.credentials)
    .where(eq(schema.credentials.id, credentialId));

  if (!credential) {
    throw new Error('Credentials not found');
  }

  if (credential.userId !== userId) {
    throw new Error('Unauthorized: Credentials do not belong to user');
  }

  return credential;
}

/**
 * Gmail Activities
 */

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

export async function sendEmailActivity(input: SendEmailInput): Promise<SendEmailOutput> {
  const activity = Context.current();
  activity.log.info('Sending email', { to: input.to, subject: input.subject });

  try {
    // Load credentials
    const credential = await loadCredentials(input.credentialId, input.userId);

    // Create legacy-compatible credentials object
    const gmailCredentials = {
      data: {
        accessToken: credential.accessToken,
        refreshToken: credential.refreshToken,
        expiresAt: credential.expiresAt ? new Date(credential.expiresAt).getTime() : undefined,
      },
    };

    // Create Gmail client
    const gmailClient = new GmailClient(gmailCredentials as any);

    // Merge template variables with trigger data
    const emailParams = {
      to: replaceTemplateVariables(input.to, input.triggerData),
      subject: replaceTemplateVariables(input.subject, input.triggerData),
      body: replaceTemplateVariables(input.body, input.triggerData),
      cc: input.cc?.map((email) => replaceTemplateVariables(email, input.triggerData)),
      bcc: input.bcc?.map((email) => replaceTemplateVariables(email, input.triggerData)),
      isHtml: input.isHtml,
    };

    // Send email
    const result = await gmailClient.sendEmail(emailParams);

    activity.log.info('Email sent successfully', {
      messageId: result.messageId,
      threadId: result.threadId,
    });

    return {
      messageId: result.messageId,
      threadId: result.threadId,
      success: true,
    };
  } catch (error) {
    activity.log.error('Failed to send email', { error: error.message });

    return {
      messageId: '',
      threadId: '',
      success: false,
      error: error.message || 'Unknown error',
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

export async function readEmailActivity(input: ReadEmailInput): Promise<ReadEmailOutput> {
  const activity = Context.current();
  activity.log.info('Reading emails', { query: input.query, maxResults: input.maxResults });

  try {
    // Load credentials
    const credential = await loadCredentials(input.credentialId, input.userId);

    // Create legacy-compatible credentials object
    const gmailCredentials = {
      data: {
        accessToken: credential.accessToken,
        refreshToken: credential.refreshToken,
        expiresAt: credential.expiresAt ? new Date(credential.expiresAt).getTime() : undefined,
      },
    };

    // Create Gmail client
    const gmailClient = new GmailClient(gmailCredentials as any);

    // List messages
    const { messages: messageList } = await gmailClient.listMessages({
      query: input.query,
      maxResults: input.maxResults || 10,
      labelIds: input.labelIds,
    });

    // Get full details for each message
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

    activity.log.info('Emails read successfully', { count: validMessages.length });

    return {
      messages: validMessages,
      totalCount: validMessages.length,
      success: true,
    };
  } catch (error) {
    activity.log.error('Failed to read emails', { error: error.message });

    return {
      messages: [],
      totalCount: 0,
      success: false,
      error: error.message || 'Unknown error',
    };
  }
}
