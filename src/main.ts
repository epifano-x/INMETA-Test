import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix(process.env.GLOBAL_PREFIX || 'api');

  const swaggerEnabled = (process.env.SWAGGER_ENABLED || 'true').toLowerCase() === 'true';
  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle('INMETA Docs API')
      .setDescription('API para gerenciamento de documentação de colaboradores')
      .setVersion('0.0.1')
      .addServer('/') // mantém
      .build();

    const doc = SwaggerModule.createDocument(app, config /*, { include: [AppModule] }*/);
    SwaggerModule.setup('docs', app, doc, { swaggerOptions: { persistAuthorization: true } });
  }

  await app.listen(Number(process.env.PORT ?? 3000));
}
bootstrap();
