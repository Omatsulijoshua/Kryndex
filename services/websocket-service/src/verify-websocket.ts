import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { io } from 'socket.io-client';
import * as jwt from 'jsonwebtoken';
import Redis from 'ioredis';

async function verifyWebSockets() {
  console.log('--- STARTING WEBSOCKETS & REAL-TIME STREAM VERIFICATION ---');

  // 1. Boot NestJS WebSocket server
  const port = 3004;
  console.log(`Starting WebSocket Server on port ${port}...`);
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: '*' });
  await app.listen(port);

  // 2. Setup mock JWT token for authenticated client
  const mockUserId = '11111111-2222-3333-4444-555555555555';
  const secret = 'kryndex_secure_jwt_secret_phrase';
  const token = jwt.sign({ userId: mockUserId }, secret);

  // 3. Connect clients
  console.log('\nConnecting clients to WebSocket server...');
  const anonClient = io(`http://localhost:${port}`);
  const authClient = io(`http://localhost:${port}`, {
    query: { token },
  });

  // Wait for connections to stabilize
  await new Promise((resolve) => setTimeout(resolve, 1000));

  let anonReceived = false;
  let authReceived = false;
  let privateUserReceived = false;

  // Setup event listeners
  anonClient.on('message', (payload) => {
    console.log('[Anon Client] Received event:', payload.channel);
    if (payload.channel === 'orderbook:BTC_USDT') {
      anonReceived = true;
    }
  });

  authClient.on('message', (payload) => {
    console.log('[Auth Client] Received event:', payload.channel);
    if (payload.channel === 'orderbook:BTC_USDT') {
      authReceived = true;
    } else if (payload.channel === `user:${mockUserId}`) {
      privateUserReceived = true;
    }
  });

  // 4. Subscribe to public streams
  console.log('\nSubscribing clients to orderbook:BTC_USDT...');
  anonClient.emit('subscribe_orderbook', { symbol: 'BTC_USDT' });
  authClient.emit('subscribe_orderbook', { symbol: 'BTC_USDT' });

  // Wait for subscription joins to register
  await new Promise((resolve) => setTimeout(resolve, 500));

  // 5. Connect Redis publisher to simulate event broadcasts
  console.log('\nInitializing Redis publisher to trigger updates...');
  const redis = new Redis({
    host: 'localhost',
    port: 6379,
    password: 'kryndex_secure_redis_pass',
  });

  // Publish public orderbook update
  console.log('Publishing BTC_USDT orderbook update to Redis...');
  const mockOrderbook = {
    bids: [{ price: '60000', quantity: '1.5' }],
    asks: [{ price: '61000', quantity: '0.8' }],
  };
  await redis.publish('orderbook:BTC_USDT', JSON.stringify(mockOrderbook));

  // Publish private user status notification
  console.log(`Publishing private notification to user:${mockUserId}...`);
  const mockNotification = {
    type: 'BALANCE_CREDIT',
    asset: 'USDT',
    amount: '500.0',
  };
  await redis.publish(`user:${mockUserId}`, JSON.stringify(mockNotification));

  // Wait for socket transmissions
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // 6. Assertions
  console.log('\nAsserting event deliveries...');
  console.log('Anonymous client received orderbook update:', anonReceived);
  console.log('Authenticated client received orderbook update:', authReceived);
  console.log('Authenticated client received private user notification:', privateUserReceived);

  if (!anonReceived || !authReceived) {
    console.error('FAIL: Public orderbook updates were not broadcast to subscribers');
    process.exit(1);
  }

  if (!privateUserReceived) {
    console.error('FAIL: Private user notifications were not delivered to target client');
    process.exit(1);
  }

  console.log('PASS: Public and private real-time streams successfully broadcasted.');

  // Clean up
  console.log('\nCleaning up verification clients...');
  anonClient.disconnect();
  authClient.disconnect();
  await redis.quit();
  await app.close();

  console.log('--- ALL WEBSOCKET & PUBSUB VERIFICATION CHECKS PASSED ---');
  process.exit(0);
}

verifyWebSockets().catch((err) => {
  console.error('WebSocket test script failed:', err);
  process.exit(1);
});
