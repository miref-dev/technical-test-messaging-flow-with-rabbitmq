import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({ origin: true });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );

  // ── Swagger ──────────────────────────────────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('MessageFlow API')
    .setDescription(
      'Mini messaging platform – simulates async delivery & real-time status updates. ' +
      'Reflects WhatsApp Business Platform / Meta messaging patterns.',
    )
    .setVersion('1.0')
    .addTag('messages', 'Send & manage messages')
    .addTag('webhooks', 'Meta-style delivery receipt webhooks')
    .addTag('templates', 'HSM / message templates')
    .addTag('dashboard', 'Real-time stats & SSE stream')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT ?? 3001;
  await app.listen(port);

  console.log(`
╔═══════════════════════════════════════════════════╗
║   🔷  MessageFlow  API Service (NestJS)           ║
║   REST  → http://localhost:${port}/api             ║
║   Docs  → http://localhost:${port}/docs            ║
║   SSE   → http://localhost:${port}/api/dashboard/stream ║
╚═══════════════════════════════════════════════════╝
  `);
}
bootstrap();
