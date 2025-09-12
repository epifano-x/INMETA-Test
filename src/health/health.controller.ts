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
  ApiTags
} from '@nestjs/swagger';
import { LogsService } from '../logs/logs.service';

class HealthOkResponse {
  ok: boolean;
}

class HealthElasticsearchOkResponse {
  ok: boolean;
  name: string;
  cluster_name: string;
  version: string;
}

class HealthElasticsearchErrorResponse {
  statusCode: number;
  message: string;
  error: string;
}

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

  /**
   * 🔹 Endpoint para checar se a API está operacional.
   * Retorna { ok: true } caso esteja funcionando normalmente.
   */
  @Get()
  @ApiOperation({
    summary: 'Health check da API',
    description:
      'Verifica se a API está em execução e responde com status 200. Útil para monitoramento básico.',
  })
  @ApiOkResponse({
    description: 'API está operacional',
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

  /**
   * 🔹 Endpoint para checar se o Elasticsearch está disponível.
   * Retorna informações sobre o cluster e a versão.
   */
  @Get('elasticsearch')
  @ApiOperation({
    summary: 'Health do Elasticsearch',
    description:
      'Verifica se o cluster do Elasticsearch está acessível e retorna informações básicas como nome, cluster e versão. ' +
      'Caso o serviço esteja indisponível, retorna 503 (Service Unavailable).',
  })
  @ApiOkResponse({
    description: 'Elasticsearch operacional',
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
    description: 'Elasticsearch indisponível',
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
