import { Controller, Get, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private readonly es: ElasticsearchService) {}

  @Get()
  @ApiOperation({ summary: 'Health check da API' })
  @ApiResponse({ status: 200, description: 'OK' })
  ok() {
    this.logger.log('GET /health');
    return { ok: true };
  }

  @Get('elasticsearch')
  @ApiOperation({ summary: 'Health do Elasticsearch' })
  @ApiResponse({ status: 200, description: 'Elasticsearch OK' })
  @ApiResponse({ status: 503, description: 'Elasticsearch indisponível' })
  async elasticsearch() {
    this.logger.log('GET /health/elasticsearch - checking ES');
    try {
      const info = await this.es.info();
      this.logger.log(`Elasticsearch OK: ${info.name} / ${info.cluster_name} / ${info.version?.number ?? 'unknown'}`);
      return { ok: true, name: info.name, cluster_name: info.cluster_name, version: info.version };
    } catch (err: any) {
      this.logger.error(`Elasticsearch FAIL: ${err?.message ?? err}`, err?.stack);
      throw new ServiceUnavailableException(err?.message ?? String(err));
    }
  }
}
