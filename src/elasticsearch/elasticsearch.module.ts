import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ElasticsearchModule } from '@nestjs/elasticsearch';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ElasticsearchModule.registerAsync({
      useFactory: (cfg: ConfigService) => {
        const node = cfg.get<string>('ELASTICSEARCH_NODE');
        if (!node) throw new Error('ELASTICSEARCH_NODE ausente. Defina no .env');

        return {
          node,
          auth: {
            username: cfg.get<string>('ELASTICSEARCH_USERNAME') ?? '',
            password: cfg.get<string>('ELASTICSEARCH_PASSWORD') ?? '',
          },
          tls:
            cfg.get('ELASTICSEARCH_TLS_REJECT_UNAUTHORIZED') === 'false'
              ? { rejectUnauthorized: false }
              : undefined,
          name: cfg.get('APP_NAME') ?? 'inmeta-docs-api',
          maxRetries: 3,
          compression: true,
          compatibilityMode: true, // fala com ES 8.x usando headers compatíveis
        };
      },
      inject: [ConfigService],
    }),
  ],
  // 👇 exporta o ElasticsearchModule já configurado
  exports: [ElasticsearchModule],
})
export class ElasticsearchAppModule {}
