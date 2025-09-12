import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health/health.controller';
import { LogsModule } from './logs/logs.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LogsModule, // <- logger + elasticsearch global
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
