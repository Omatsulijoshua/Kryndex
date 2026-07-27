import {
  WebSocketGateway as NestWebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';
import { Inject, forwardRef } from '@nestjs/common';
import { RedisService } from './redis.service';

@NestWebSocketGateway({
  cors: { origin: '*' },
  namespace: '/',
})
export class WebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly jwtSecret = process.env.JWT_SECRET || 'kryndex_secure_jwt_secret_phrase';

  constructor(
    @Inject(forwardRef(() => RedisService))
    private readonly _redisService: RedisService,
  ) {
    this._redisService;
  }

  handleConnection(client: Socket) {
    try {
      const token = client.handshake.query?.token as string || client.handshake.headers?.authorization?.split(' ')[1];
      
      if (token) {
        const decoded = jwt.verify(token, this.jwtSecret) as { userId: string };
        client.data.userId = decoded.userId;
        client.join(`user:${decoded.userId}`);
        console.log(`[WS] Authenticated user connected: ${decoded.userId} (socket: ${client.id})`);
      } else {
        console.log(`[WS] Anonymous client connected (socket: ${client.id})`);
      }
    } catch (err: any) {
      console.warn(`[WS] Connection authentication failed: ${err.message}`);
      // Allow connection as anonymous for public streams (orderbooks, tickers)
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`[WS] Client disconnected (socket: ${client.id})`);
  }

  // 1. PUBLIC ORDER BOOK SUBSCRIPTIONS
  @SubscribeMessage('subscribe_orderbook')
  handleSubscribeOrderBook(
    @MessageBody('symbol') symbol: string,
    @ConnectedSocket() client: Socket,
  ) {
    if (!symbol) return { error: 'Symbol is required' };
    const room = `orderbook:${symbol}`;
    client.join(room);
    console.log(`[WS] Client ${client.id} subscribed to ${room}`);
    return { status: 'SUBSCRIBED', room };
  }

  // 2. PUBLIC Ticker/Trade execution feeds
  @SubscribeMessage('subscribe_trades')
  handleSubscribeTrades(
    @MessageBody('symbol') symbol: string,
    @ConnectedSocket() client: Socket,
  ) {
    if (!symbol) return { error: 'Symbol is required' };
    const room = `trades:${symbol}`;
    client.join(room);
    console.log(`[WS] Client ${client.id} subscribed to ${room}`);
    return { status: 'SUBSCRIBED', room };
  }

  // 3. Forward incoming Redis Pub/Sub events to WebSocket channels
  handlePubSubMessage(channel: string, payload: any) {
    // Rooms are named identically to the Redis channels: orderbook:symbol, trades:symbol, user:userId
    this.server.to(channel).emit('message', {
      channel,
      data: payload,
    });
  }
}
