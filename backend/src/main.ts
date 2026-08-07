import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const port = configService.get<number>('port') || 3000;
  const apiPrefix = configService.get<string>('apiPrefix') || 'api/v1';

  app.setGlobalPrefix(apiPrefix);

  app.enableCors({
    origin: configService.get<string[]>('corsOrigins') || true,
    credentials: true,
  });

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

  await app.listen(port);
  console.log(
    `🚀 MLM Backend Server running on: http://localhost:${port}/${apiPrefix}`,
  );
  console.log(
    `📚 Swagger Documentation available at: http://localhost:${port}/api/docs`,
  );
}

void bootstrap().catch((err) => {
  console.error('Fatal error starting NestJS server:', err);
  process.exit(1);
});
