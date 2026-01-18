import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../db/schema";
import { services } from "../db/schema";
import { ServiceProvider } from "../common/types/enums";

const connectionString = `postgresql://${process.env.POSTGRES_USER || "area"}:${process.env.POSTGRES_PASSWORD || "area"}@${process.env.POSTGRES_HOST || "localhost"}:${process.env.POSTGRES_PORT || "5432"}/${process.env.POSTGRES_NAME || "area"}`;
const client = postgres(connectionString);
const db = drizzle(client, { schema });

async function seed() {
  console.log("Seeding services...");

  const servicesData = [
    {
      provider: ServiceProvider.GMAIL,
      name: "Gmail",
      description: "Send and receive emails using Gmail.",
      imageUrl:
        "https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg",
      version: "1.0.0",
      supportedActions: ["send_email", "read_email"],
      credentialTypes: ["oauth2"],
      isActive: true,
    },
    {
      provider: ServiceProvider.GOOGLE_SHEETS,
      name: "Google Sheets",
      description: "Create and manage spreadsheets.",
      imageUrl:
        "https://upload.wikimedia.org/wikipedia/commons/3/30/Google_Sheets_logo_%282014-2020%29.svg",
      version: "1.0.0",
      supportedActions: [
        "create_document",
        "add_row",
        "update_cell",
        "read_range",
      ],
      credentialTypes: ["oauth2"],
      isActive: true,
    },
    {
      provider: ServiceProvider.SPOTIFY,
      name: "Spotify",
      description: "Play music, manage playlists, and more.",
      imageUrl:
        "https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg",
      version: "1.0.0",
      supportedActions: [
        "play_music",
        "add_to_playlist",
        "create_document",
        "skip_track",
        "pause_playback",
        "like_current_track",
      ],
      credentialTypes: ["oauth2"],
      isActive: true,
    },
    {
      provider: ServiceProvider.TWITCH,
      name: "Twitch",
      description: "Interact with live streams and chat.",
      imageUrl:
        "https://upload.wikimedia.org/wikipedia/commons/d/dd/Twitch_Glitch_Logo_purple.svg",
      version: "1.0.0",
      supportedActions: [
        "update_stream_title",
        "send_chat_message",
        "create_clip",
        "start_commercial",
        "create_stream_marker",
      ],
      credentialTypes: ["oauth2"],
      isActive: true,
    },
    {
      provider: ServiceProvider.YOUTUBE,
      name: "YouTube",
      description: "Manage videos, playlists, and subscriptions.",
      imageUrl:
        "https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg",
      version: "1.0.0",
      supportedActions: [
        "create_document",
        "delete_document",
        "rate_video",
        "subscribe_channel",
        "unsubscribe_channel",
        "comment_video",
      ],
      credentialTypes: ["oauth2"],
      isActive: true,
    },
  ];

  for (const service of servicesData) {
    await db
      .insert(services)
      .values(service as any)
      .onConflictDoUpdate({
        target: services.provider,
        set: service as any,
      });
    console.log(`Seeded ${service.name}`);
  }

  console.log("Seeding complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
