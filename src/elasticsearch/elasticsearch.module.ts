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
      useFactory: (cfg: ConfigService) => ({
        node: cfg.get<string>('ELASTICSEARCH_NODE'),
        auth: {
          username: cfg.get<string>('ELASTICSEARCH_USERNAME'),
          password: cfg.get<string>('ELASTICSEARCH_PASSWORD'),
        },
        tls: cfg.get('ELASTICSEARCH_TLS_REJECT_UNAUTHORIZED') === 'false'
          ? { rejectUnauthorized: false }
          : undefined,
        // nameia app no client
        name: 'INMETA',
        compression: true,
        maxRetries: 3,
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [LogsService],
  exports: [NestElasticsearchModule, LogsService],
})
export class ElasticsearchModule {}