import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  if (process.env.SWAGGER_ENABLED === 'true') {
    const config = new DocumentBuilder()
      .setTitle('INMETA Docs API')
      .setDescription('Dev API — documentation & health only')
      .setVersion('0.1.0')
      .build();
    const doc = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, doc);
  }

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
}
bootstrap();
