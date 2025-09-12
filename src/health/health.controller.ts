import { Controller, Get, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LogsService } from '../logs/logs.service';

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
    await this.logs.emit('log', 'health.ok', HealthController.name);
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
      const name = info?.name;
      const cluster_name = info?.cluster_name;
      const version = info?.version?.number ?? info?.version;

      await this.logs.emit('log', 'health.elasticsearch.ok', HealthController.name, {
        name,
        cluster_name,
        version,
      });

      return { ok: true, name, cluster_name, version };
    } catch (err: any) {
      const message = err?.message ?? String(err);
      await this.logs.emit('warn', 'health.elasticsearch.error', HealthController.name, {
        error: message,
      });
      throw new ServiceUnavailableException(message);
    }
  }
}
