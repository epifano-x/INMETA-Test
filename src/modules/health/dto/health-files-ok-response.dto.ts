import { ApiProperty } from '@nestjs/swagger';

export class HealthFilesOkResponse {
  @ApiProperty({ example: true })
  ok: boolean;

  @ApiProperty({ example: '/app/uploads' })
  path: string;
}