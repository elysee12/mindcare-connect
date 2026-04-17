import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:8081',
  });

  // Serve static files from uploads directory
  app.useStaticAssets('./uploads', {
    prefix: '/uploads/',
  });

  const port = Number(process.env.PORT || 3000);
  await app.listen(port);
  console.log(`Backend is running on http://localhost:${port}`);
}
bootstrap();
