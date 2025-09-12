import { ApiProperty } from '@nestjs/swagger';

export class HealthElasticsearchErrorResponse {
  @ApiProperty({
    example: 503,
    description: 'HTTP status code returned when Elasticsearch is unavailable',
  })
  statusCode: number;

  @ApiProperty({
    example: 'connect ECONNREFUSED 127.0.0.1:9200',
    description: 'Error message with connection details',
  })
  message: string;

  @ApiProperty({
    example: 'Service Unavailable',
    description: 'Type of error',
  })
  error: string;
}
