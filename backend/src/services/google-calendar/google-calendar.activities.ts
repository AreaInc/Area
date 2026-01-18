import { Context } from "@temporalio/activity";
import { google } from "googleapis";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import * as schema from "../../db/schema";
import { GoogleCalendarClient } from "./google-calendar-client";
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
        throw new Error("Missing OAuth2 refresh credentials, cannot refresh token.");
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

function getClient(credential: any) {
    const googleCredentials = {
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
    return new GoogleCalendarClient(googleCredentials);
}

export interface CreateEventInput {
    calendarId?: string;
    summary: string;
    description?: string;
    location?: string;
    start: string; // ISO string
    end: string;   // ISO string
    attendees?: string[];
    credentialId: number;
    userId: string;
    triggerData?: Record<string, any>;
}

export async function createEventActivity(input: CreateEventInput) {
    const activity = Context.current();
    activity.log.info("Creating google calendar event", { summary: input.summary });

    try {
        const credential = await ensureFreshAccessToken(await loadCredentials(input.credentialId, input.userId));
        const client = getClient(credential);

        const summary = replaceTemplateVariables(input.summary, input.triggerData);
        const description = input.description ? replaceTemplateVariables(input.description, input.triggerData) : undefined;
        const location = input.location ? replaceTemplateVariables(input.location, input.triggerData) : undefined;
        const startStr = replaceTemplateVariables(input.start, input.triggerData); // Should be ISO
        const endStr = replaceTemplateVariables(input.end, input.triggerData);     // Should be ISO

        // Simple check if it looks like a date, if not, maybe try to construct one? 
        // For now assume user passes valid ISO strings via replacements or direct input.

        const result = await client.createEvent({
            calendarId: input.calendarId,
            summary,
            description,
            location,
            start: { dateTime: startStr },
            end: { dateTime: endStr },
            attendees: input.attendees
        });

        return {
            id: result.id,
            htmlLink: result.htmlLink,
            success: true
        };
    } catch (error: any) {
        activity.log.error("Failed to create event", { error: error.message });
        throw error;
    }
}

export interface QuickAddEventInput {
    text: string;
    calendarId?: string;
    credentialId: number;
    userId: string;
    triggerData?: Record<string, any>;
}

export async function quickAddEventActivity(input: QuickAddEventInput) {
    const activity = Context.current();
    try {
        const credential = await ensureFreshAccessToken(await loadCredentials(input.credentialId, input.userId));
        const client = getClient(credential);
        const text = replaceTemplateVariables(input.text, input.triggerData);

        const result = await client.quickAdd({
            calendarId: input.calendarId,
            text
        });
        return {
            id: result.id,
            htmlLink: result.htmlLink,
            success: true
        };
    } catch (err: any) {
        activity.log.error("Quick add failed", { error: err.message });
        throw err;
    }
}
