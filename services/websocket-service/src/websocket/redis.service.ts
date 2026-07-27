import { Injectable, OnModuleInit, OnModuleDestroy, Inject, forwardRef } from '@nestjs/common';
import Redis from 'ioredis';
import { WebSocketGateway } from './websocket.gateway';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private pubClient!: Redis;
  private subClient!: Redis;

  constructor(
    @Inject(forwardRef(() => WebSocketGateway))
    private readonly wsGateway: WebSocketGateway,
  ) {}

  onModuleInit() {
    const redisOptions = {
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || 'kryndex_secure_redis_pass',
    };

    console.log(`Connecting to Redis on ${redisOptions.host}:${redisOptions.port}...`);
    this.pubClient = new Redis(redisOptions);
    this.subClient = new Redis(redisOptions);

    // Subscribe to channels
    this.subClient.psubscribe('orderbook:*', 'trades:*', 'user:*');

    this.subClient.on('pmessage', (_pattern, channel, message) => {
      try {
        const payload = JSON.parse(message);
        this.wsGateway.handlePubSubMessage(channel, payload);
      } catch (err) {
        console.error(`Failed to parse Pub/Sub message from channel ${channel}:`, err);
      }
    });
  }

  async onModuleDestroy() {
    await this.pubClient.quit();
    await this.subClient.quit();
  }
}
