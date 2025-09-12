// health.controller.ts
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
  async ok() {
    await this.logs.log(this.logs.indexBase, 'info', 'GET /health -> 200');
    return { ok: true };
  }

  @Get('elasticsearch')
  @ApiOperation({ summary: 'Health do Elasticsearch' })
  @ApiResponse({ status: 200, description: 'Elasticsearch OK' })
  @ApiResponse({ status: 503, description: 'Elasticsearch indisponível' })
  async elasticsearch() {
    try {
      const info = await this.es.info();
      await this.logs.log(this.logs.indexBase, 'info', 'GET /health/elasticsearch -> 200', {
        es: { name: info.name, cluster: info.cluster_name, version: info.version },
      });
      return { ok: true, name: info.name, cluster_name: info.cluster_name, version: info.version };
    } catch (err: any) {
      await this.logs.log(this.logs.indexBase, 'error', 'GET /health/elasticsearch -> 503', {
        error: err?.message ?? String(err),
      });
      throw new ServiceUnavailableException(err?.message ?? String(err));
    }
  }
}
