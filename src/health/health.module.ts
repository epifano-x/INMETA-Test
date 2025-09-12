import { Module } from '@nestjs/common';
import { LogsModule } from '../logs/logs.module';
import { HealthController } from './health.controller';

@Module({
  imports: [LogsModule],
  controllers: [HealthController],
})
export class HealthModule {}
