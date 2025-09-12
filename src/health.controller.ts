import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LogsService } from './logs/logs.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly es: ElasticsearchService,
    private readonly logs: LogsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Health check da API' })
  @ApiResponse({ status: 200, description: 'OK' })
  ok() {
    return { ok: true };
  }

  @Get('elasticsearch')
  @ApiOperation({ summary: 'Health do Elasticsearch' })
  @ApiResponse({ status: 200, description: 'Elasticsearch OK' })
  @ApiResponse({ status: 503, description: 'Elasticsearch indisponível' })
  async elasticsearch() {
    const started = Date.now();
    const route = '/api/health/elasticsearch'; // só pra constar no log
    const app = process.env.APP_NAME ?? 'inmeta-docs-api';
    const environment = process.env.ENVIRONMENT ?? process.env.NODE_ENV ?? 'development';

    // log de "bateu no endpoint"
    await this.logs.log(this.logs.indexBase, 'info', 'health.elasticsearch.hit', {
      app,
      environment,
      route,
    });

    try {
      const info = await this.es.info();

      // log de sucesso
      await this.logs.log(this.logs.indexBase, 'info', 'health.elasticsearch.ok', {
        app,
        environment,
        route,
        status: 200,
        took_ms: Date.now() - started,
        cluster: info.cluster_name,
        node: info.name,
        version: info.version?.number ?? info.version,
      });

      return {
        ok: true,
        name: info.name,
        cluster_name: info.cluster_name,
        version: info.version,
      };
    } catch (err: any) {
      // log de erro (não derruba se o log falhar; o LogsService já trata)
      await this.logs.log(this.logs.indexBase, 'error', 'health.elasticsearch.error', {
        app,
        environment,
        route,
        status: 503,
        took_ms: Date.now() - started,
        error: err?.message ?? String(err),
      });

      throw new ServiceUnavailableException(err?.message ?? String(err));
    }
  }
}
