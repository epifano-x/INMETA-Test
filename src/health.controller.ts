import { Controller, Get, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LogsService } from './logs/logs.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    private readonly es: ElasticsearchService,
    private readonly logs: LogsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Health check da API' })
  @ApiResponse({ status: 200, description: 'OK' })
  async ok() {
    this.logger.log('GET /health');
    await this.logs.log('health.ok');
    return { ok: true };
  }

  @Get('elasticsearch')
  @ApiOperation({ summary: 'Health do Elasticsearch' })
  @ApiResponse({ status: 200, description: 'Elasticsearch OK' })
  @ApiResponse({ status: 503, description: 'Elasticsearch indisponível' })
  async elasticsearch() {
    this.logger.log('GET /health/elasticsearch - checking ES');
    try {
      const info: any = await this.es.info();
      await this.logs.log('health.elasticsearch.ok', {
        name: info.name,
        cluster_name: info.cluster_name,
        version: info.version?.number ?? info.version,
      });
      return {
        ok: true,
        name: info.name,
        cluster_name: info.cluster_name,
        version: info.version,
      };
    } catch (err: any) {
      await this.logs.log('health.elasticsearch.error', { error: err?.message ?? String(err) }, 'warn');
      throw new ServiceUnavailableException(err?.message ?? String(err));
    }
  }
}
