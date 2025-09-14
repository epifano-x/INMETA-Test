import { ApiProperty } from '@nestjs/swagger';

export class HealthDatabaseErrorResponse {
  @ApiProperty({
    example: 503,
    description: 'HTTP status code returned when the database is unavailable',
  })
  statusCode: number;

  @ApiProperty({
    example: 'Database connection failed',
    description: 'Error message with connection details',
  })
  message: string;

  @ApiProperty({
    example: 'Service Unavailable',
    description: 'Type of error',
  })
  error: string;
}
