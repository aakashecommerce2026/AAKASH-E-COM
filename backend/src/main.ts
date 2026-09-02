import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

import * as express from 'express';
import * as fs from 'fs';
import { join } from 'path';
import helmet from 'helmet';

import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  const configService = app.get(ConfigService);

  const nodeEnv = configService.get<string>('nodeEnv') || 'development';
  const port = configService.get<number>('port') || 3000;
  const apiPrefix = configService.get<string>('apiPrefix') || 'api/v1';
  const jwtSecret = configService.get<string>('jwtSecret');

  // Security Safeguard: Verify JWT Secret in Production Mode
  if (nodeEnv === 'production') {
    if (
      !jwtSecret ||
      jwtSecret.includes('change-me') ||
      jwtSecret === 'dev-jwt-secret-key-12345'
    ) {
      logger.error(
        'CRITICAL SECURITY ERROR: Insecure or default JWT_SECRET detected in production environment!',
      );
      throw new Error(
        'Insecure JWT_SECRET configured for production. Refusing to start server.',
      );
    }
  }

  // Enforce HTTP Security Headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options)
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // Ensure uploads directory exists
  const uploadsDir = join(process.cwd(), 'uploads', 'profile-photos');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Serve static uploaded profile photos
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  app.setGlobalPrefix(apiPrefix);

  const corsOrigins = configService.get<string[]>('corsOrigins');
  app.enableCors({
    origin:
      nodeEnv === 'production'
        ? corsOrigins && corsOrigins.length > 0
          ? corsOrigins
          : false
        : corsOrigins || true,
    credentials: true,
  });

  app.useGlobalFilters(new HttpExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger Documentation Setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('AAKASH MLM Backend API')
    .setDescription(
      'REST API Documentation for AAKASH E-COM Multi-Level Marketing Backend Service',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port, '0.0.0.0');
  logger.log(
    `🚀 MLM Backend Server running in [${nodeEnv.toUpperCase()}] mode on: http://127.0.0.1:${port}/${apiPrefix}`,
  );
  logger.log(
    `📚 Swagger Documentation available at: http://127.0.0.1:${port}/api/docs`,
  );
}

void bootstrap().catch((err) => {
  console.error('Fatal error starting NestJS server:', err);
  process.exit(1);
});
