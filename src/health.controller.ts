import { Controller, Get } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly es: ElasticsearchService) {}

  @Get()
  @ApiOperation({ summary: 'Health check da API' })
  @ApiResponse({ status: 200, description: 'OK' })
  ok() {
    return { ok: true };
  }

  @Get('elasticsearch')
  @ApiOperation({ summary: 'Health do Elasticsearch' })
  @ApiResponse({ status: 200, description: 'Info do cluster ou erro de conexão' })
  async elasticsearch() {
    try {
      const info = await this.es.info();
      return { ok: true, name: info.name, cluster_name: info.cluster_name, version: info.version };
    } catch (err: any) {
      return { ok: false, error: err?.message ?? String(err) };
    }
  }
}
