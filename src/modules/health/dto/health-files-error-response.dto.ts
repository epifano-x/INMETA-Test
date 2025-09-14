import { ApiProperty } from '@nestjs/swagger';

export class HealthFilesErrorResponse {
  @ApiProperty({ example: 503 })
  statusCode: number;

  @ApiProperty({ example: 'File storage check failed' })
  message: string;

  @ApiProperty({ example: 'Service Unavailable' })
  error: string;
}