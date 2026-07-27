import { Module } from '@nestjs/common';
import { WebSocketGateway } from './websocket.gateway';
import { RedisService } from './redis.service';

@Module({
  providers: [WebSocketGateway, RedisService],
  exports: [WebSocketGateway, RedisService],
})
export class WebSocketModule {}
