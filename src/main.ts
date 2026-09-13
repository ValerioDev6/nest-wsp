import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import 'dotenv/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: true,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('CRM WhatsApp API')
    .setDescription(
      'API de gestión de conversaciones de WhatsApp vía Meta Cloud API.',
    )
    .setVersion('1.0')
    .addTag('connection', 'Estado de la integración con WhatsApp')
    .addTag('conversations', 'Conversaciones y mensajes')
    .addTag('webhook', 'Endpoint de eventos de Meta')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  Logger.log(`🚀 Application is running on: http://localhost:${port}/api`);
  Logger.log(`📚 Swagger docs on: http://localhost:${port}/docs`);
}

bootstrap();
