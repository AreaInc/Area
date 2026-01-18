import { Context } from "@temporalio/activity";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import * as schema from "../../db/schema";
import { YouTubeClient } from "./youtube-client";

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

  return new YouTubeClient({
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

export interface CreatePlaylistInput {
  title: string;
  description?: string;
  credentialId: number;
  userId: string;
}
export async function createPlaylistActivity(input: CreatePlaylistInput) {
  const client = await getClient(input.credentialId, input.userId);
  const playlist = await client.createPlaylist(input.title, input.description);
  return {
    success: true,
    playlistId: playlist.id,
    title: playlist.snippet?.title,
  };
}

export interface DeletePlaylistInput {
  playlistName: string;
  credentialId: number;
  userId: string;
}
export async function deletePlaylistActivity(input: DeletePlaylistInput) {
  const client = await getClient(input.credentialId, input.userId);
  const playlist = await client.findPlaylist(input.playlistName);
  if (!playlist || !playlist.id)
    throw new Error(`Playlist ${input.playlistName} not found`);
  await client.deletePlaylist(playlist.id);
  return { success: true };
}

export interface RateVideoInput {
  videoId: string;
  rating: "like" | "dislike" | "none";
  credentialId: number;
  userId: string;
}
export async function rateVideoActivity(input: RateVideoInput) {
  const client = await getClient(input.credentialId, input.userId);
  await client.rateVideo(input.videoId, input.rating);
  return { success: true };
}

export interface SubscribeChannelInput {
  channelName: string;
  credentialId: number;
  userId: string;
}
export async function subscribeChannelActivity(input: SubscribeChannelInput) {
  const client = await getClient(input.credentialId, input.userId);
  const channel = await client.searchChannel(input.channelName);
  if (!channel || !channel.id?.channelId)
    throw new Error(`Channel ${input.channelName} not found`);
  await client.subscribe(channel.id.channelId);
  return { success: true, channelId: channel.id.channelId };
}

export interface UnsubscribeChannelInput {
  channelName: string;
  credentialId: number;
  userId: string;
}
export async function unsubscribeChannelActivity(
  input: UnsubscribeChannelInput,
) {
  const client = await getClient(input.credentialId, input.userId);
  const channel = await client.searchChannel(input.channelName);
  if (!channel || !channel.id?.channelId)
    throw new Error(`Channel ${input.channelName} not found`);
  const subscription = await client.findSubscription(channel.id.channelId);
  if (!subscription || !subscription.id)
    throw new Error(`Subscription to ${input.channelName} not found`);
  await client.unsubscribe(subscription.id);
  return { success: true };
}

export interface CommentVideoInput {
  videoId: string;
  comment: string;
  credentialId: number;
  userId: string;
}
export async function commentVideoActivity(input: CommentVideoInput) {
  const client = await getClient(input.credentialId, input.userId);
  await client.commentVideo(input.videoId, input.comment);
  return { success: true };
}
