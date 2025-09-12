import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ElasticsearchAppModule } from './elasticsearch/elasticsearch.module';
import { HealthController } from './health.controller';
import { LogsModule } from './logs/logs.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), ElasticsearchAppModule, LogsModule],
  controllers: [HealthController],
})
export class AppModule {}
