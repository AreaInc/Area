import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import * as schema from "../../db/schema";
import { SpotifyClient } from "./spotify-client";

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

// Helper to get client with auto-refresh capability (handled inside client using credentials data)
async function getClient(credentialId: number, userId: string) {
  const credential = await loadCredentials(credentialId, userId);
  return new SpotifyClient({
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

// Helper to ensure proper URI format if user inputs raw ID
function formatSpotifyUri(input: string, type: "track" | "playlist"): string {
  if (input.startsWith("spotify:")) return input;
  return `spotify:${type}:${input}`;
}

export interface PlayMusicInput {
  trackUri: string;
  credentialId: number;
  userId: string;
}
export async function playMusicActivity(input: PlayMusicInput) {
  const client = await getClient(input.credentialId, input.userId);
  if (!input.trackUri) throw new Error("Track URI is required");

  const trackUri = formatSpotifyUri(input.trackUri, "track");
  await client.playTrack(trackUri);
  return { success: true };
}

export interface AddToPlaylistInput {
  playlistId: string;
  trackUri: string;
  credentialId: number;
  userId: string;
}
export async function addToPlaylistActivity(input: AddToPlaylistInput) {
  const client = await getClient(input.credentialId, input.userId);

  if (!input.playlistId) throw new Error("Playlist ID is required");
  if (!input.trackUri) throw new Error("Track URI is required");

  // playlistId is strictly an ID for the endpoint /playlists/{playlist_id}/tracks
  // so we don't format it as URI. However, the track MUST be a URI.

  // BUT wait, input.playlistId might be a URI (spotify:playlist:id) if user copies that.
  // The endpoint expects ID. So we should strip it if present.
  let cleanPlaylistId = input.playlistId;
  if (cleanPlaylistId.startsWith("spotify:playlist:")) {
    cleanPlaylistId = cleanPlaylistId.replace("spotify:playlist:", "");
  }

  const trackUri = formatSpotifyUri(input.trackUri, "track");

  await client.addTracksToPlaylist(cleanPlaylistId, [trackUri]);
  return { success: true };
}

export interface CreatePlaylistInput {
  name: string;
  description?: string;
  credentialId: number;
  userId: string;
}
export async function createSpotifyPlaylistActivity(
  input: CreatePlaylistInput,
) {
  const credential = await loadCredentials(input.credentialId, input.userId);
  // retrieving user profile needs valid token
  const client = new SpotifyClient({
    clientId: credential.clientId || undefined,
    clientSecret: credential.clientSecret || undefined,
    data: {
      accessToken: credential.accessToken || undefined,
      refreshToken: credential.refreshToken || undefined,
      expiresAt: credential.expiresAt?.getTime(),
    },
  });

  // We need spotify user ID to create playlist
  const profile: any = await client.getUserProfile();
  const result: any = await client.createPlaylist(
    profile.id,
    input.name,
    input.description,
  );

  return {
    playlistId: result.id,
    playlistUrl: result.external_urls?.spotify,
    success: true,
  };
}

export interface SkipTrackInput {
  credentialId: number;
  userId: string;
}
export async function skipTrackActivity(input: SkipTrackInput) {
  const client = await getClient(input.credentialId, input.userId);
  await client.skipTrack();
  return { success: true };
}

export interface PausePlaybackInput {
  credentialId: number;
  userId: string;
}
export async function pausePlaybackActivity(input: PausePlaybackInput) {
  const client = await getClient(input.credentialId, input.userId);
  await client.pausePlayback();
  return { success: true };
}

export interface LikeCurrentTrackInput {
  credentialId: number;
  userId: string;
}
export async function likeCurrentTrackActivity(input: LikeCurrentTrackInput) {
  const client = await getClient(input.credentialId, input.userId);
  const state: any = await client.getPlayerState();
  if (!state || !state.item) throw new Error("No track currently playing");

  await client.likeTrack(state.item.id);
  return {
    trackName: state.item.name,
    success: true,
  };
}
