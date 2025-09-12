import {
  Controller,
  Get,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import {
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { LogsService } from '../logs/logs.service';

import { HealthElasticsearchErrorResponse } from './dto/health-elasticsearch-error-response.dto';
import { HealthElasticsearchOkResponse } from './dto/health-elasticsearch-ok-response.dto';
import { HealthOkResponse } from './dto/health-ok-response.dto';

@ApiTags('health')
@ApiExtraModels(
  HealthOkResponse,
  HealthElasticsearchOkResponse,
  HealthElasticsearchErrorResponse,
)
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    private readonly es: ElasticsearchService,
    private readonly logs: LogsService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'API Health Check',
    description:
      'Checks if the API is running and returns status 200 when it is available. Useful for basic monitoring.',
  })
  @ApiOkResponse({
    description: 'API is healthy and operational',
    type: HealthOkResponse,
    schema: {
      example: { ok: true },
    },
  })
  async ok() {
    this.logger.log('GET /health');
    await this.logs.emit('log', 'health.ok', HealthController.name);
    return { ok: true };
  }

  @Get('elasticsearch')
  @ApiOperation({
    summary: 'Elasticsearch Health Check',
    description:
      'Checks if the Elasticsearch cluster is reachable and returns basic information such as node name, cluster name, and version. ' +
      'If the service is unavailable, returns HTTP 503.',
  })
  @ApiOkResponse({
    description: 'Elasticsearch is healthy and operational',
    type: HealthElasticsearchOkResponse,
    schema: {
      example: {
        ok: true,
        name: 'es-node-1',
        cluster_name: 'my-cluster',
        version: '8.10.2',
      },
    },
  })
  @ApiServiceUnavailableResponse({
    description: 'Elasticsearch is unavailable',
    type: HealthElasticsearchErrorResponse,
    schema: {
      example: {
        statusCode: 503,
        message: 'connect ECONNREFUSED 127.0.0.1:9200',
        error: 'Service Unavailable',
      },
    },
  })
  async elasticsearch() {
    this.logger.log('GET /health/elasticsearch - checking Elasticsearch');
    try {
      const info: any = await this.es.info();
      const name = info?.name;
      const cluster_name = info?.cluster_name;
      const version = info?.version?.number ?? info?.version;

      await this.logs.emit(
        'log',
        'health.elasticsearch.ok',
        HealthController.name,
        { name, cluster_name, version },
      );

      return { ok: true, name, cluster_name, version };
    } catch (err: any) {
      const message = err?.message ?? String(err);
      await this.logs.emit(
        'warn',
        'health.elasticsearch.error',
        HealthController.name,
        { error: message },
      );
      throw new ServiceUnavailableException(message);
    }
  }
}
