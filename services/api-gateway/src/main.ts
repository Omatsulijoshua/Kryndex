import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createProxyServer } from 'http-proxy';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS matching security guidelines
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : true,
    credentials: true,
  });

  const port = process.env.GATEWAY_PORT || 3000;
  await app.listen(port);
  console.info(`[API Gateway] Running on port ${port}`);

  // Setup WebSocket proxy forwarding to websocket-service (default localhost:3004)
  const wsTarget = process.env.WEBSOCKET_SERVICE_URL || 'http://localhost:3004';
  const proxy = createProxyServer({
    target: wsTarget,
    ws: true,
  });

  proxy.on('error', (err: any) => {
    console.error('[API Gateway Proxy-WS] Error forwarding WebSocket connection:', err);
  });

  const server = app.getHttpServer();
  server.on('upgrade', (req: any, socket: any, head: any) => {
    if (req.url.startsWith('/socket.io')) {
      console.log(`[API Gateway Proxy-WS] Routing socket upgrade request: ${req.url}`);
      proxy.ws(req, socket, head);
    }
  });
}
bootstrap();
