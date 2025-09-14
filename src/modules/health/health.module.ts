import { Module } from '@nestjs/common';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { LogsModule } from '../logs/logs.module';
import { HealthController } from './controllers/health.controller';

@Module({
  imports: [
    ElasticsearchModule,
    LogsModule,
  ],
  controllers: [HealthController],
})
export class HealthModule {}
