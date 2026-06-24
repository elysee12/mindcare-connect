import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: true, // Allow all origins for testing
    credentials: true,
  });

  // Serve static files from uploads directory using absolute path
  const uploadsPath = join(process.cwd(), 'uploads');
  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads/',
    index: false,
    redirect: false,
    setHeaders: (res) => {
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Cache-Control', 'public, max-age=3600');
    },
  });
  console.log(`Serving static files from: ${uploadsPath}`);

  const port = Number(process.env.PORT || 3000);
  await app.listen(port, '0.0.0.0'); 
  console.log(`Backend is running on http://localhost:${port}`);
  console.log(`Test upload URL: http://localhost:${port}/uploads/test.txt`);
}
bootstrap();
