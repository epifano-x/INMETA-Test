import { Controller, Get } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly es: ElasticsearchService) {}

  @Get()
  @ApiOkResponse({ description: 'API is healthy' })
  getHealth() {
    return { status: 'ok', ts: new Date().toISOString() };
  }

  @Get('elasticsearch')
  @ApiOkResponse({ description: 'Elasticsearch connectivity' })
  async elasticHealth() {
    const info = await this.es.info();
    return {
      clusterName: info.cluster_name,
      clusterUuid: info.cluster_uuid,
      version: info.version?.number,
      tagline: info.tagline,
    };
  }
}
