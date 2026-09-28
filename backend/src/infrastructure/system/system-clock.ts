import { Injectable, type Provider } from '@nestjs/common';
import { CLOCK, type ClockPort } from '@application/ports/clock.port';

@Injectable()
export class SystemClock implements ClockPort {
  now(): Date {
    return new Date();
  }
}

export const CLOCK_PROVIDER: Provider = {
  provide: CLOCK,
  useClass: SystemClock,
};
