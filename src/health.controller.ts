import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOkResponse({ schema: { example: { status: 'ok' } } })
  get() {
    return { status: 'ok' };
  }
}
