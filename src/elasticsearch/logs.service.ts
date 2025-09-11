import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ElasticsearchService } from '@nestjs/elasticsearch';

@Injectable()
export class LogsService {
  private readonly logger = new Logger(LogsService.name);
  readonly indexBase: string;

  constructor(
    private readonly es: ElasticsearchService,
    private readonly cfg: ConfigService,
  ) {
    this.indexBase = (this.cfg.get('APP_NAME') ?? 'inmeta-docs-api').toLowerCase();
  }

  dailyIndex(base?: string) {
    const y = new Date().getFullYear().toString().padStart(4, '0');
    const m = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const d = new Date().getDate().toString().padStart(2, '0');
    const prefix = base ?? this.indexBase;
    return `${prefix}-${y}.${m}.${d}`;
  }

  async ensureTemplate() {
    try {
      await this.es.indices.putIndexTemplate({
        name: `logs-${this.indexBase}-template`,
        _meta: { managed_by: 'inmeta-docs-api' },
        index_patterns: [`${this.indexBase}-*`],
        template: {
          settings: {
            number_of_shards: 1,
            number_of_replicas: 0,
          },
          mappings: {
            dynamic: 'strict',
            properties: {
              ts: { type: 'date' },
              level: { type: 'keyword' },
              message: { type: 'text' },
              http: {
                properties: {
                  method: { type: 'keyword' },
                  path: { type: 'keyword' },
                  status: { type: 'integer' },
                  took_ms: { type: 'integer' },
                  user_agent: { type: 'text' },
                  ip: { type: 'keyword' },
                },
              },
            },
          },
        },
        priority: 10,
      });
    } catch (e: any) {
      this.logger.warn(`Falha ao garantir template 'logs-${this.indexBase}-template': ${e?.message ?? e}`);
    }
  }

  async log(index: string, level: string, message: string, extra?: Record<string, any>) {
    try {
      await this.es.index({
        index: this.dailyIndex(index), // <— agora compila
        refresh: false,
        document: { ts: new Date().toISOString(), level, message, ...extra },
      });
    } catch (e: any) {
      this.logger.warn(`[LogsService] falha ao indexar log: ${e?.message ?? e}`);
    }
  }

  async logHttp(req: any, tookMs: number, status: number) {
    const path = (req.originalUrl ?? req.url ?? '').split('?')[0];
    return this.log(this.indexBase, 'info', `${req.method} ${path} -> ${status} (${tookMs}ms)`, {
      http: {
        method: req.method,
        path,
        status,
        took_ms: Math.round(tookMs),
        user_agent: req.headers?.['user-agent'],
        ip: req.ip ?? req.headers?.['x-forwarded-for'] ?? req.connection?.remoteAddress,
      },
    });
  }
}
