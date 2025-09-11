import { Module } from '@nestjs/common';
import { ElasticsearchAppModule } from './elasticsearch';
import { HealthController } from './health.controller';

@Module({
  imports: [ElasticsearchAppModule],
  controllers: [HealthController],      // 👈 essencial pro Swagger enxergar rotas
})
export class AppModule {}
