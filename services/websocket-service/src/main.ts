import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  app.enableCors({ origin: '*' });

  const port = process.env.WEBSOCKET_SERVICE_PORT || 3004;
  await app.listen(port);
  console.info(`[WebSocket Service] Listening on port ${port}`);
}
bootstrap();
