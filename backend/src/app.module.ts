import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DrizzleModule } from './db/drizzle.module';

import { AuthModule } from '@thallesp/nestjs-better-auth';
import { auth } from './auth'; // Your Better Auth instance

@Module({
  imports: [DrizzleModule, AuthModule.forRoot({ auth })],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
