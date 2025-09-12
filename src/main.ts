import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module'; // mantém o teu AppModule
import { LogsService } from './logs/logs.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = new Logger('Bootstrap');
  const cfg = app.get(ConfigService);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  if ((cfg.get<string>('SWAGGER_ENABLED') ?? 'true').toString().toLowerCase() !== 'false') {
    const doc = new DocumentBuilder()
      .setTitle(cfg.get('APP_NAME') ?? 'inmeta-docs-api')
      .build();
    const docRef = SwaggerModule.createDocument(app, doc);
    SwaggerModule.setup('api/docs', app, docRef);
  }

  const port = Number(process.env.PORT || 3000);
  await app.listen(port);

  // log de startup (não falha se ES estiver fora)
  try {
    const logs = app.get(LogsService);
    await logs.log('app.started', { port });
  } catch {}

  logger.log(`App ouvindo em :${port}`);
}

bootstrap();
