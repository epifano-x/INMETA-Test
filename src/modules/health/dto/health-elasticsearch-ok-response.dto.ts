import { ApiProperty } from '@nestjs/swagger';

export class HealthElasticsearchOkResponse {
  @ApiProperty({
    example: true,
    description: 'Indicates whether Elasticsearch is up and running',
  })
  ok: boolean;

  @ApiProperty({
    example: 'es-node-1',
    description: 'Elasticsearch node name',
  })
  name: string;

  @ApiProperty({
    example: 'my-cluster',
    description: 'Elasticsearch cluster name',
  })
  cluster_name: string;

  @ApiProperty({
    example: '8.10.2',
    description: 'Elasticsearch version number',
  })
  version: string;
}
