import { ApiProperty } from '@nestjs/swagger';

export class HealthDatabaseOkResponse {
  @ApiProperty({
    example: true,
    description: 'Indicates that the database is healthy and reachable',
  })
  ok: boolean;

  @ApiProperty({
    example: '2025-09-14T12:34:56.789Z',
    description: 'Current timestamp returned by the database',
  })
  now: string;
}
