import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiProperty, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

export class HealthResponse {
  @ApiProperty({ example: 'ok' })
  status!: 'ok';
}

@ApiTags('health')
@SkipThrottle()
@Controller('health')
export class HealthController {
  @Get()
  @ApiOkResponse({ type: HealthResponse, description: 'La API está en marcha' })
  check(): HealthResponse {
    return { status: 'ok' };
  }
}
