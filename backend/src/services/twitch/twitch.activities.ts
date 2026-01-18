import { Context } from "@temporalio/activity";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import * as schema from "../../db/schema";
import { TwitchClient } from "./twitch-client";

const connectionString = `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_NAME}`;
const queryClient = postgres(connectionString);
const db = drizzle(queryClient, { schema });

async function getClient(credentialId: number, userId: string) {
  const [credential] = await db
    .select()
    .from(schema.credentials)
    .where(eq(schema.credentials.id, credentialId));

  if (!credential) throw new Error("Credentials not found");
  if (credential.userId !== userId) throw new Error("Unauthorized");

  return new TwitchClient({
    clientId: credential.clientId || undefined,
    clientSecret: credential.clientSecret || undefined,
    data: {
      accessToken: credential.accessToken || undefined,
      refreshToken: credential.refreshToken || undefined,
      expiresAt: credential.expiresAt?.getTime(),
    },
  });
}

// --- Activities ---

export interface UpdateStreamTitleInput {
  title: string;
  credentialId: number;
  userId: string;
}
export async function updateStreamTitleActivity(input: UpdateStreamTitleInput) {
  const client = await getClient(input.credentialId, input.userId);
  const user = await client.getUserInfo();
  await client.updateChannelInfo(user.id, { title: input.title });
  return { success: true };
}

export interface UpdateStreamGameInput {
  gameName: string;
  credentialId: number;
  userId: string;
}
export async function updateStreamGameActivity(input: UpdateStreamGameInput) {
  const client = await getClient(input.credentialId, input.userId);
  const user = await client.getUserInfo();
  const game = await client.getGameByName(input.gameName);
  if (!game) throw new Error(`Game not found: ${input.gameName}`);

  await client.updateChannelInfo(user.id, { game_id: game.id });
  return { success: true, gameId: game.id, gameName: game.name };
}

export interface SendChatMessageInput {
  message: string;
  credentialId: number;
  userId: string;
}
export async function sendChatMessageActivity(input: SendChatMessageInput) {
  const client = await getClient(input.credentialId, input.userId);
  const user = await client.getUserInfo();
  // Assuming sending to own channel
  await client.sendChatMessage(user.id, user.id, input.message);
  return { success: true };
}

export interface CreateClipInput {
  hasDelay?: boolean;
  credentialId: number;
  userId: string;
}
export async function createClipActivity(input: CreateClipInput) {
  const client = await getClient(input.credentialId, input.userId);
  const user = await client.getUserInfo();
  const clip = await client.createClip(user.id, input.hasDelay);
  return { success: true, clipId: clip.id, editUrl: clip.edit_url };
}

export interface StartCommercialInput {
  length: number;
  credentialId: number;
  userId: string;
}
export async function startCommercialActivity(input: StartCommercialInput) {
  const client = await getClient(input.credentialId, input.userId);
  const user = await client.getUserInfo();
  const result = await client.startCommercial(user.id, input.length);
  return {
    success: true,
    length: result.length,
    retryAfter: result.retry_after,
  };
}

export interface CreateStreamMarkerInput {
  description?: string;
  credentialId: number;
  userId: string;
}
export async function createStreamMarkerActivity(
  input: CreateStreamMarkerInput,
) {
  const client = await getClient(input.credentialId, input.userId);
  const user = await client.getUserInfo();
  const marker = await client.createStreamMarker(
    user.id,
    input.description || "Marker",
  );
  return {
    success: true,
    markerId: marker.id,
    positionSeconds: marker.position_seconds,
  };
}
