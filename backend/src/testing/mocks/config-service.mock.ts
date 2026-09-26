import type { ConfigService } from '@nestjs/config';
import type { EnvironmentVariables } from '@config/env.validation';

/** ConfigService con valores fijos, sin leer `.env` ni `process.env`. */
export const mockConfigService = (
  values: Partial<EnvironmentVariables>,
): ConfigService<EnvironmentVariables, true> =>
  ({
    get: (key: keyof EnvironmentVariables) => values[key],
  }) as unknown as ConfigService<EnvironmentVariables, true>;
