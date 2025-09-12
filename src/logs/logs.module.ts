import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { LogsService } from './logs.service';

@Global()
@Module({
  imports: [
    ConfigModule,
    ElasticsearchModule.registerAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => {
        const node = cfg.get<string>('ELASTICSEARCH_NODE');
        const username = cfg.get<string>('ELASTICSEARCH_USERNAME');
        const password = cfg.get<string>('ELASTICSEARCH_PASSWORD');
        const rejectUnauthorized = String(
          cfg.get('ELASTICSEARCH_TLS_REJECT_UNAUTHORIZED') ?? 'false',
        ).toLowerCase() === 'true';

        return {
          node,
          auth: username && password ? { username, password } : undefined,
          tls: { rejectUnauthorized },
          // evita travar build se ES não responde na inicialização
          maxRetries: 1,
          requestTimeout: 2000,
        };
      },
    }),
  ],
  providers: [LogsService],
  exports: [LogsService],
})
export class LogsModule {}
