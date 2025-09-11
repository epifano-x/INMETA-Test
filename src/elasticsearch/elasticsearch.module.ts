import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { LogsService } from './logs.service';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ElasticsearchModule.registerAsync({
      useFactory: (cfg: ConfigService) => {
        const node = cfg.get<string>('ELASTICSEARCH_NODE');
        if (!node) throw new Error('ELASTICSEARCH_NODE ausente. Defina no .env');

        return {
          node,
          auth: (cfg.get('ELASTICSEARCH_USERNAME') && cfg.get('ELASTICSEARCH_PASSWORD'))
            ? {
                username: cfg.get<string>('ELASTICSEARCH_USERNAME')!,
                password: cfg.get<string>('ELASTICSEARCH_PASSWORD')!,
              }
            : undefined,
          tls: cfg.get('ELASTICSEARCH_TLS_REJECT_UNAUTHORIZED') === 'false'
            ? { rejectUnauthorized: false }
            : undefined,
          name: cfg.get('APP_NAME') ?? 'inmeta-docs-api',
          maxRetries: 3,
          compression: true,
          compatibilityMode: true, // fala com ES 8.x
          requestTimeout: 30_000,
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [LogsService],
  exports: [LogsService, ElasticsearchModule], // 👈 essencial
})
export class ElasticsearchAppModule {}
