import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

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
}
bootstrap();
