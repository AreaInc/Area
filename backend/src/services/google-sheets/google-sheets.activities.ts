import { Context } from "@temporalio/activity";
import { google } from "googleapis";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import * as schema from "../../db/schema";
import { GoogleSheetsClient } from "./google-sheets-client";

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
        if (!credential.refreshToken || !credential.clientId || !credential.clientSecret) {
            throw new Error("Missing OAuth2 refresh credentials");
        }
        const oauth2Client = new google.auth.OAuth2(credential.clientId, credential.clientSecret);
        oauth2Client.setCredentials({ refresh_token: credential.refreshToken });
        const { credentials: newTokens } = await oauth2Client.refreshAccessToken();
        const newExpiresAt = newTokens.expiry_date ? new Date(newTokens.expiry_date) : null;

        await db.update(schema.credentials).set({
            accessToken: newTokens.access_token || credential.accessToken,
            refreshToken: newTokens.refresh_token || credential.refreshToken,
            expiresAt: newExpiresAt,
            isValid: true,
            updatedAt: new Date(),
        }).where(eq(schema.credentials.id, credential.id));

        return { ...credential, accessToken: newTokens.access_token, refreshToken: newTokens.refresh_token, expiresAt: newExpiresAt };
    }
    return credential;
}

async function getClient(credentialId: number, userId: string) {
    const loaded = await loadCredentials(credentialId, userId);
    const credential = await ensureFreshAccessToken(loaded);
    return new GoogleSheetsClient({
        data: {
            accessToken: credential.accessToken,
            refreshToken: credential.refreshToken,
            expiresAt: credential.expiresAt ? new Date(credential.expiresAt).getTime() : undefined,
        },
        clientId: credential.clientId || undefined,
        clientSecret: credential.clientSecret || undefined,
    });
}

// Interfaces and Activities

export interface CreateSpreadsheetInput { title: string; credentialId: number; userId: string; }
export async function createSpreadsheetActivity(input: CreateSpreadsheetInput) {
    const client = await getClient(input.credentialId, input.userId);
    const result = await client.createSpreadsheet(input.title);
    return { spreadsheetId: result.spreadsheetId, spreadsheetUrl: result.spreadsheetUrl, success: true };
}

export interface AddRowInput { spreadsheetId: string; sheetName?: string; values: any[]; credentialId: number; userId: string; }
export async function addRowActivity(input: AddRowInput) {
    const client = await getClient(input.credentialId, input.userId);
    const result = await client.appendRow(input.spreadsheetId, input.sheetName, input.values);
    return { updatedRange: result.updates?.updatedRange, success: true };
}

export interface UpdateCellInput { spreadsheetId: string; range: string; value: any; credentialId: number; userId: string; }
export async function updateCellActivity(input: UpdateCellInput) {
    const client = await getClient(input.credentialId, input.userId);
    const result = await client.updateCell(input.spreadsheetId, input.range, input.value);
    return { updatedRange: result.updatedRange, success: true };
}

export interface ReadRangeInput { spreadsheetId: string; range: string; credentialId: number; userId: string; }
export async function readRangeActivity(input: ReadRangeInput) {
    const client = await getClient(input.credentialId, input.userId);
    const result = await client.readRange(input.spreadsheetId, input.range);
    return { values: result.values, success: true };
}

export interface CreateSheetInput { spreadsheetId: string; sheetTitle: string; credentialId: number; userId: string; }
export async function createSheetActivity(input: CreateSheetInput) {
    const client = await getClient(input.credentialId, input.userId);
    const result = await client.createSheet(input.spreadsheetId, input.sheetTitle);
    return { ...result, success: true };
}

export interface ClearRangeInput { spreadsheetId: string; range: string; credentialId: number; userId: string; }
export async function clearRangeActivity(input: ClearRangeInput) {
    const client = await getClient(input.credentialId, input.userId);
    const result = await client.clearRange(input.spreadsheetId, input.range);
    return { clearedRange: result.clearedRange, success: true };
}

export interface DuplicateSheetInput { spreadsheetId: string; newTitle: string; credentialId: number; userId: string; }
export async function duplicateSheetActivity(input: DuplicateSheetInput) {
    const client = await getClient(input.credentialId, input.userId);
    const result = await client.duplicateSheet(input.spreadsheetId, input.newTitle);
    return { ...result, success: true };
}

export interface FindReplaceInput { spreadsheetId: string; find: string; replacement: string; sheetId?: number; credentialId: number; userId: string; }
export async function findReplaceActivity(input: FindReplaceInput) {
    const client = await getClient(input.credentialId, input.userId);
    const result = await client.findReplace(input.spreadsheetId, input.find, input.replacement, input.sheetId);
    return { ...result, success: true };
}

export interface SortRangeInput { spreadsheetId: string; range: string; sortColumn?: string; ascending: boolean; credentialId: number; userId: string; }
export async function sortRangeActivity(input: SortRangeInput) {
    const client = await getClient(input.credentialId, input.userId);
    await client.sortRange(input.spreadsheetId, input.range, input.sortColumn, input.ascending);
    return { success: true };
}
