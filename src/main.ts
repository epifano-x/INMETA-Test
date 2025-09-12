import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { RequestLoggerInterceptor } from './common/interceptors/request-logger.interceptor';
import { LogsService } from './logs/logs.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const cfg = app.get(ConfigService);
  const logs = app.get(LogsService);

  // usa nosso logger como logger global do Nest
  app.useLogger(logs);

  // filtro global de exceções
  app.useGlobalFilters(new AllExceptionsFilter(logs));

  // validation
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // interceptor de log de requisições
  app.useGlobalInterceptors(new RequestLoggerInterceptor(logs));
  
  // swagger opcional
  if (String(cfg.get('SWAGGER_ENABLED') ?? 'true').toLowerCase() === 'true') {
    const doc = new DocumentBuilder()
      .setTitle('INMETA Docs API')
      .setVersion('1.0.0')
      .addServer('api/')
      .build();
    const document = SwaggerModule.createDocument(app, doc);
    SwaggerModule.setup('docs', app, document);
  }

  app.setGlobalPrefix('api');

  const port = Number(process.env.PORT || 3000);

  // captura fatalidades de processo e manda pro ES
  process.on('uncaughtException', async (err) => {
    await logs.emit('error', 'uncaughtException', 'process', {
      name: err.name,
      message: err.message,
      stack: err.stack,
    });
  });
  process.on('unhandledRejection', async (reason: any) => {
    await logs.emit('error', 'unhandledRejection', 'process', {
      reason: typeof reason === 'string' ? reason : JSON.stringify(reason),
    });
  });

  await app.listen(port);
  Logger.log(`App up on port ${port}`, 'Bootstrap');
  await logs.emit('log', 'app_started', 'Bootstrap', { port });
}

bootstrap();
