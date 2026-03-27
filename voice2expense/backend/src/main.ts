import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { json } from 'express';

let app: any;

async function createApp() {
  if (!app) {
    app = await NestFactory.create(AppModule);

    // Allow large JSON bodies for base64 audio uploads
    app.use(json({ limit: '10mb' }));

    app.enableCors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true,
    });

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    app.setGlobalPrefix('api');
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalInterceptors(new LoggingInterceptor());

    await app.init();
  }
  return app;
}

async function bootstrap() {
  const application = await createApp();
  const port = process.env.PORT || 3001;
  await application.listen(port);
  console.log(`Server running on http://localhost:${port}`);
}

// For Vercel serverless
export default async function handler(req: any, res: any) {
  const application = await createApp();
  const instance = application.getHttpAdapter().getInstance();
  instance(req, res);
}

// Local dev
if (!process.env.VERCEL) {
  bootstrap();
}
