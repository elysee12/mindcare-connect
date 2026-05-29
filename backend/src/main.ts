import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: true, // Allow all origins for testing
    credentials: true,
  });

  // Serve static files from uploads directory
  app.useStaticAssets('./uploads', {
    prefix: '/uploads/',
  });

  const port = Number(process.env.PORT || 3000);
  await app.listen(port, '0.0.0.0'); 
  console.log(`Backend is running on http://localhost:${port}`);
}
bootstrap();
