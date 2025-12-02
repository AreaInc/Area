import { Module } from '@nestjs/common';
import { EventsGateway } from './websockets.gateway';

@Module({
  providers: [EventsGateway],
})
export class EventsModule {}
