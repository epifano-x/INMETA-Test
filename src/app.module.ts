// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ElasticsearchModule } from '@nestjs/elasticsearch';

import { HealthController } from './health/health.controller';
import { LogsModule } from './logs/logs.module';

@Module({
  imports: [
    // carrega .env e deixa global
    ConfigModule.forRoot({ isGlobal: true }),

    // registra o provider ElasticsearchService
    ElasticsearchModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => {
        const node = cfg.get<string>('ELASTICSEARCH_NODE');
        const username = cfg.get<string>('ELASTICSEARCH_USERNAME');
        const password = cfg.get<string>('ELASTICSEARCH_PASSWORD');
        const rejectStr = cfg.get<string>('ELASTICSEARCH_TLS_REJECT_UNAUTHORIZED');
        const rejectUnauthorized =
          rejectStr === undefined ? true : rejectStr.toString().toLowerCase() !== 'false';

        return {
          node,
          auth: username && password ? { username, password } : undefined,
          tls: { rejectUnauthorized },
          // não força conexão na inicialização; só quando usar
          // (client do @elastic é lazy, então ok para ambiente local sem ES)
        };
      },
    }),

    LogsModule, // seu módulo de logs
  ],
  controllers: [HealthController],
})
export class AppModule {}
