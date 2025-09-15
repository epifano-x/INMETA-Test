import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { RequestLoggerInterceptor } from './common/interceptors/request-logger.interceptor';
import { LogsService } from './modules/logs/logs.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const cfg = app.get(ConfigService);
  const logs = app.get(LogsService);

  app.useLogger(logs);

  app.useGlobalFilters(new AllExceptionsFilter(logs));

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidUnknownValues: false }));

  app.useGlobalInterceptors(new RequestLoggerInterceptor(logs));
  
  if (String(cfg.get('SWAGGER_ENABLED') ?? 'true').toLowerCase() === 'true') {
    const doc = new DocumentBuilder()
      .setTitle('INMETA Docs API')
      .setDescription('API da INMETA com integração ao Keycloak')
      .setVersion('1.0.0')
      .addTag('health', 'Endpoints for application and Elasticsearch health checks')
      .addTag('employees', 'Employee registration and documentation management')
      .addTag('document-types', 'Document type registration and management')
      .addServer('api/')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          in: 'header',
        },
        'access-token',
      )
      .build();

    const document = SwaggerModule.createDocument(app, doc);
    SwaggerModule.setup('docs', app, document);
  }

  app.setGlobalPrefix('api');

  const port = Number(process.env.PORT || 3000);

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
