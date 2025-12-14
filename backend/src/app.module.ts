import "dotenv/config";

import { Module } from "@nestjs/common";
import { CacheModule } from "@nestjs/cache-manager";
import { redisStore } from "cache-manager-ioredis-yet";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { DrizzleModule } from "./db/drizzle.module";

import { EventsModule } from "./websockets.module";
import { ServicesModule } from "./services/services-module";
import { ApiModule } from "./api/api.module";

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
        });
        return {
          store: () => store,
        };
      },
    }),
    DrizzleModule,
    AuthModule.forRoot({ auth }),
    EventsModule,
    ServicesModule,
    ApiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
