import type { ClientOptions } from '@elastic/elasticsearch';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ElasticsearchModule as NestElasticsearchModule } from '@nestjs/elasticsearch';
import { LogsService } from './logs.service';

@Global()
@Module({
  imports: [
    ConfigModule,
    NestElasticsearchModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (cfg: ConfigService) => {
        const node = cfg.get<string>('ELASTICSEARCH_NODE') || '';
        const username = cfg.get<string>('ELASTICSEARCH_USERNAME');
        const password = cfg.get<string>('ELASTICSEARCH_PASSWORD');
        const rejectUnauthorized =
          (cfg.get<string>('ELASTICSEARCH_TLS_REJECT_UNAUTHORIZED') || '').toLowerCase() !== 'false';

        const options: Partial<ClientOptions> = {
          node,
          name: 'inmeta-docs-api',
          compression: true,
          maxRetries: 3,
        };

        if (username && password) {
          options.auth = { username, password }; // BasicAuth
        }
        if (!rejectUnauthorized) {
          // Node.js TLS options
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (options as any).tls = { rejectUnauthorized: false };
        }

        return options as ClientOptions;
      },
      inject: [ConfigService],
    }),
  ],
  providers: [LogsService],
  exports: [NestElasticsearchModule, LogsService],
})
export class ElasticsearchModule {}
