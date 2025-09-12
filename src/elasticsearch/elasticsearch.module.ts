import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ElasticsearchModule } from '@nestjs/elasticsearch';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ElasticsearchModule.registerAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => {
        const node = cfg.get<string>('ELASTICSEARCH_NODE');
        if (!node) throw new Error('ELASTICSEARCH_NODE ausente. Defina no .env');

        const username = cfg.get<string>('ELASTICSEARCH_USERNAME');
        const password = cfg.get<string>('ELASTICSEARCH_PASSWORD');
        const rejectUnauthorized =
          (cfg.get<string>('ELASTICSEARCH_TLS_REJECT_UNAUTHORIZED') ?? 'false')
            .toString()
            .toLowerCase() !== 'false';

        return {
          node,
          auth: username && password ? { username, password } : undefined,
          name: cfg.get('APP_NAME') ?? 'inmeta-docs-api',
          maxRetries: 3,
          requestTimeout: 30_000,
          compression: true,
          compatibilityMode: true,
          tls:
            node.startsWith('https://')
              ? { rejectUnauthorized }
              : undefined,
        };
      },
    }),
  ],
  exports: [ElasticsearchModule],
})
export class ElasticsearchAppModule {}
