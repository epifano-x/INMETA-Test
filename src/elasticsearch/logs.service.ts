import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ElasticsearchService } from '@nestjs/elasticsearch';

@Injectable()
export class LogsService {
  private readonly logger = new Logger(LogsService.name);
  private readonly indexBase: string;

  constructor(
    private readonly es: ElasticsearchService,
    private readonly cfg: ConfigService,
  ) {
    this.indexBase = this.cfg.get<string>('ELASTICSEARCH_LOGS_INDEX') ?? 'logs-INMETA';
  }

  private dailyIndex() {
    const d = new Date().toISOString().slice(0, 10).replace(/-/g, '.'); // YYYY.MM.DD
    return `${this.indexBase}-${d}`;
  }

  async ensureTemplate() {
    const templateName = `${this.indexBase}-template`;
    const exists = await this.es.indices.existsIndexTemplate({ name: templateName }).catch(() => false);
    if (!exists) {
      await this.es.indices.putIndexTemplate({
        name: templateName,
        index_patterns: [`${this.indexBase}-*`],
        template: {
          settings: {
            number_of_shards: 1,
            number_of_replicas: 0,
          },
          mappings: {
            dynamic: 'true',
            properties: {
              ts: { type: 'date' },
              level: { type: 'keyword' },
              requestId: { type: 'keyword' },
              route: { type: 'keyword' },
              method: { type: 'keyword' },
              statusCode: { type: 'integer' },
              durationMs: { type: 'float' },
              message: { type: 'text' },
              service: { type: 'keyword' },
              env: { type: 'keyword' },
              host: { type: 'keyword' },
              remoteIp: { type: 'ip' },
              userId: { type: 'keyword' },
            },
          },
        },
        priority: 50,
        _meta: { managed_by: 'INMETA' },
      });
      this.logger.log(`Created index template: ${templateName}`);
    }
  }

  async log(doc: Record<string, any>) {
    try {
      await this.es.index({
        index: this.dailyIndex(),
        document: {
          ts: new Date().toISOString(),
          service: 'INMETA',
          env: process.env.NODE_ENV ?? 'development',
          ...doc,
        },
      });
    } catch (e) {
      this.logger.error('Failed to index log to Elasticsearch', e as any);
    }
  }
}
