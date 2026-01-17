import { Context } from "@temporalio/activity";
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
            expiresAt: credential.expiresAt?.getTime()
        }
    });
}

// --- Activities ---

export interface PlayMusicInput { trackName?: string; trackUri?: string; credentialId: number; userId: string; }
export async function playMusicActivity(input: PlayMusicInput) {
    const client = await getClient(input.credentialId, input.userId);
    let uri = input.trackUri;
    if (!uri && input.trackName) {
        uri = await client.searchTrack(input.trackName);
    }
    if (!uri) throw new Error("No track URI provided or found");

    await client.playTrack(uri);
    return { success: true };
}

export interface AddToPlaylistInput { playlistName?: string; playlistId?: string; trackName?: string; trackUri?: string; credentialId: number; userId: string; }
export async function addToPlaylistActivity(input: AddToPlaylistInput) {
    const client = await getClient(input.credentialId, input.userId);

    let pId = input.playlistId;
    if (!pId && input.playlistName) {
        try {
            const playlist = await client.searchPlaylist(input.playlistName);
            if (!playlist || !playlist.id) {
                // searchPlaylist usually throws if empty, but extra safety here
                throw new Error(`Playlist '${input.playlistName}' not found or invalid response`);
            }
            pId = playlist.id;
        } catch (error) {
            throw new Error(`Failed to find playlist '${input.playlistName}': ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    if (!pId) throw new Error("Playlist ID or Name must be provided, or playlist was not found.");

    let tUri = input.trackUri;
    if (!tUri && input.trackName) {
        try {
            tUri = await client.searchTrack(input.trackName);
        } catch (error) {
            throw new Error(`Failed to find track '${input.trackName}': ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    if (!tUri) throw new Error("Track URI or Name must be provided, or track was not found.");

    await client.addTracksToPlaylist(pId, [tUri]);
    return { success: true };
}

export interface CreatePlaylistInput { name: string; description?: string; credentialId: number; userId: string; }
export async function createSpotifyPlaylistActivity(input: CreatePlaylistInput) {
    const credential = await loadCredentials(input.credentialId, input.userId);
    // retrieving user profile needs valid token
    const client = new SpotifyClient({
        clientId: credential.clientId || undefined,
        clientSecret: credential.clientSecret || undefined,
        data: {
            accessToken: credential.accessToken || undefined,
            refreshToken: credential.refreshToken || undefined,
            expiresAt: credential.expiresAt?.getTime()
        }
    });

    // We need spotify user ID to create playlist
    const profile: any = await client.getUserProfile();
    const result: any = await client.createPlaylist(profile.id, input.name, input.description);

    return {
        playlistId: result.id,
        playlistUrl: result.external_urls?.spotify,
        success: true
    };
}

export interface SkipTrackInput { credentialId: number; userId: string; }
export async function skipTrackActivity(input: SkipTrackInput) {
    const client = await getClient(input.credentialId, input.userId);
    await client.skipTrack();
    return { success: true };
}

export interface PausePlaybackInput { credentialId: number; userId: string; }
export async function pausePlaybackActivity(input: PausePlaybackInput) {
    const client = await getClient(input.credentialId, input.userId);
    await client.pausePlayback();
    return { success: true };
}

export interface LikeCurrentTrackInput { credentialId: number; userId: string; }
export async function likeCurrentTrackActivity(input: LikeCurrentTrackInput) {
    const client = await getClient(input.credentialId, input.userId);
    const state: any = await client.getPlayerState();
    if (!state || !state.item) throw new Error("No track currently playing");

    await client.likeTrack(state.item.id);
    return {
        trackName: state.item.name,
        success: true
    };
}
