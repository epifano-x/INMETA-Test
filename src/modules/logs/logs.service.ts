import {
  ConsoleLogger,
  Injectable,
  LoggerService,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ElasticsearchService } from '@nestjs/elasticsearch';

type Level = 'log' | 'error' | 'warn' | 'debug' | 'verbose';

@Injectable()
export class LogsService extends ConsoleLogger implements LoggerService, OnModuleInit {
  private index!: string;
  private appName!: string;

  constructor(
    private readonly es: ElasticsearchService,
    private readonly cfg: ConfigService,
  ) {
    super('Nest');
  }

  async onModuleInit() {
    this.appName = this.cfg.get<string>('APP_NAME') || 'inmeta-docs-api';

    this.index = (this.cfg.get<string>('ELASTICSEARCH_LOGS_INDEX') || 'inmeta').toLowerCase();

    try {
      const exists = await this.es.indices.exists({ index: this.index });
      if (!exists) {
        await this.es.indices.create({
          index: this.index,
          settings: { number_of_shards: 1, number_of_replicas: 0 },
          mappings: {
            dynamic: true,
            properties: {
              '@timestamp': { type: 'date' },
              level: { type: 'keyword' },
              app: { type: 'keyword' },
              context: { type: 'keyword' },
              message: { type: 'text' },
              meta: { type: 'object', enabled: true },
            },
          },
        });
        super.log(`ES index created: ${this.index}`, 'LogsService');
      } else {
        super.log(`ES index exists: ${this.index}`, 'LogsService');
      }
    } catch (e: any) {
      super.warn(
        `ES index check/create failed for ${this.index}: ${e?.message || e}`,
        'LogsService',
      );
    }
  }


  async emit(
    level: Level,
    message: any,
    context?: string,
    meta?: Record<string, any>,
  ) {
    this.console(level, message, context, meta);

    try {
      await this.es.index({
        index: this.index,
        document: {
          '@timestamp': new Date().toISOString(),
          level,
          app: this.appName,
          context: context || undefined,
          message: this.ensureString(message),
          meta: meta || undefined,
        },
      });
    } catch (e) {
      super.warn(`ES log failed: ${String(e?.message || e)}`, 'LogsService');
    }
  }

  async log(message: any, context?: string) {
    await this.emit('log', message, context);
  }
  async error(message: any, trace?: string, context?: string) {
    await this.emit('error', message, context, trace ? { trace } : undefined);
  }
  async warn(message: any, context?: string) {
    await this.emit('warn', message, context);
  }
  async debug(message: any, context?: string) {
    await this.emit('debug', message, context);
  }
  async verbose(message: any, context?: string) {
    await this.emit('verbose', message, context);
  }

  private console(
    level: Level,
    message: any,
    context?: string,
    meta?: Record<string, any>,
  ) {
    const msg = this.ensureString(message);
    switch (level) {
      case 'error':
        super.error(msg, meta?.trace, context);
        break;
      case 'warn':
        super.warn(msg, context);
        break;
      case 'debug':
        super.debug(msg, context);
        break;
      case 'verbose':
        super.verbose(msg, context);
        break;
      default:
        super.log(msg, context);
    }
  }

  private ensureString(m: any) {
    if (typeof m === 'string') return m;
    try {
      return JSON.stringify(m);
    } catch {
      return String(m);
    }
  }
}
