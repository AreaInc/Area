import "dotenv/config";

import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { DrizzleModule } from "./db/drizzle.module";

import { EventsModule } from "./websockets.module";

import { AuthModule } from "@thallesp/nestjs-better-auth";
import { auth } from "./auth"; // Your Better Auth instance

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
  imports: [DrizzleModule, AuthModule.forRoot({ auth }), EventsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
