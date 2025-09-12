import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ElasticsearchModule } from '@nestjs/elasticsearch';

import { HealthModule } from './health/health.module';
import { LogsModule } from './logs/logs.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

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
        };
      },
    }),

    LogsModule,
    HealthModule,
  ],
})
export class AppModule {}
