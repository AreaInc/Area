import "dotenv/config";

import { Module } from "@nestjs/common";
import { CacheModule } from "@nestjs/cache-manager";
import { redisStore } from "cache-manager-ioredis-yet";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { DrizzleModule } from "./db/drizzle.module";

import { EventsModule } from "./websockets.module";
import { ApiModule } from "./api/api.module";
import { TemporalModule } from "./services/temporal/temporal.module";
import { WorkflowsModule } from "./services/workflows/workflows.module";
import { GmailModule } from "./services/gmail/gmail.module";
import { WebhookModule } from "./services/webhook/webhook.module";
import { SchedulerModule } from "./services/scheduler/scheduler.module";
import { DiscordModule } from "./services/discord/discord.module";
import { TelegramModule } from "./services/telegram/telegram.module";
import { GoogleSheetsModule } from "./services/google-sheets/google-sheets.module";
import { SpotifyModule } from "./services/spotify/spotify.module";
import { TwitchModule } from "./services/twitch/twitch.module";
import { YouTubeModule } from "./services/youtube/youtube.module";
import { RegistriesModule } from "./services/registries/registries.module";

import { AuthModule } from "@thallesp/nestjs-better-auth";
import { auth } from "./auth";

// NOTE:
// To use Redis in your Module you may add the redis transporter to your module
// when adding it in the imports like so:
//     ClientsModule.register([
//       {
//         name: 'MATH_SERVICE',
//         transport: Transport.REDIS,
//         options: {
//           host: process.env.REDIS_HOST,
//           port: process.env.REDIS_PORT,
//         }
//       },
//     ]),

@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        const store = await redisStore({
          host: process.env.REDIS_HOST,
          port: Number(process.env.REDIS_PORT ?? 6379),
          password: process.env.REDIS_PASS,
          ttl: 60, // 60 seconds default TTL
          retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            console.log(`[Redis Cache] Retrying connection (attempt ${times})...`);
            return delay;
          },
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
          lazyConnect: true,
        });
        // Handle connection errors to prevent unhandled error events
        const client = (store as any).client;
        if (client && client.on) {
          client.on("error", (err: Error) => {
            console.error("[Redis Cache] Connection error:", err.message);
          });
          client.on("connect", () => {
            console.log("[Redis Cache] Connected successfully");
          });
          client.on("ready", () => {
            console.log("[Redis Cache] Ready to accept commands");
          });
        }
        return {
          store: () => store,
        };
      },
    }),
    DrizzleModule,
    AuthModule.forRoot({ auth }),
    EventsModule,
    TemporalModule,
    RegistriesModule,
    WorkflowsModule,
    GmailModule,
    WebhookModule,
    SchedulerModule,
    DiscordModule,
    TelegramModule,
    GoogleSheetsModule,
    SpotifyModule,
    TwitchModule,
    YouTubeModule,
    ApiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
