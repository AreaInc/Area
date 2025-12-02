import { WebSocketGateway } from '@nestjs/websockets';

// NOTE:
// Here you will be able to define websocket events (https://docs.nestjs.com/websockets/gateways#overview)
// @SubscribeMessage('events')
// handleEvent(@MessageBody() data: string): string {
//   return data;
// }

@WebSocketGateway({ namespace: 'websocket' })
export class EventsGateway {}
