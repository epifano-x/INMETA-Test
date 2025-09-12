import { ApiProperty } from '@nestjs/swagger';

export class HealthOkResponse {
  @ApiProperty({
    example: true,
    description: 'Indicates whether the API is up and running',
  })
  ok: boolean;
}
