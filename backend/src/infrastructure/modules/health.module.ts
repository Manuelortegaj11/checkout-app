import { Module } from '@nestjs/common';
import { HealthController } from '../http/controllers/health.controller';

@Module({
  controllers: [HealthController],
})
export class HealthModule {}
