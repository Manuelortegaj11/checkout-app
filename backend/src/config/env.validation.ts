import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsUrl,
  Matches,
  Max,
  Min,
  validateSync,
} from 'class-validator';

const NODE_ENVS = ['development', 'test', 'production'] as const;

export class EnvironmentVariables {
  @IsIn(NODE_ENVS)
  NODE_ENV: (typeof NODE_ENVS)[number] = 'development';

  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 3001;

  @IsUrl({ require_tld: false, require_protocol: true })
  CORS_ORIGIN: string = 'http://localhost:3000';

  @IsUrl({
    require_tld: false,
    require_protocol: true,
    protocols: ['postgresql', 'postgres'],
  })
  DATABASE_URL!: string;

  @IsUrl({ require_protocol: true, protocols: ['https'] })
  PAYMENT_GATEWAY_BASE_URL!: string;

  @Matches(/^pub_\w+$/, {
    message: 'PAYMENT_GATEWAY_PUBLIC_KEY must start with pub_',
  })
  PAYMENT_GATEWAY_PUBLIC_KEY!: string;

  @Matches(/^\S{16,}$/, {
    message:
      'PAYMENT_GATEWAY_INTEGRITY_SECRET must be at least 16 characters without spaces',
  })
  PAYMENT_GATEWAY_INTEGRITY_SECRET!: string;

  @IsInt()
  @Min(1_000)
  @Max(60_000)
  PAYMENT_GATEWAY_TIMEOUT_MS: number = 10_000;

  @IsInt()
  @Min(0)
  @Max(30_000)
  PAYMENT_GATEWAY_POLL_TIMEOUT_MS: number = 10_000;

  @IsInt()
  @Min(250)
  @Max(10_000)
  PAYMENT_GATEWAY_POLL_INTERVAL_MS: number = 1_000;

  @IsInt()
  @Min(0)
  @Max(5)
  PAYMENT_GATEWAY_GET_RETRIES: number = 2;

  @IsInt()
  @Min(50)
  @Max(5_000)
  PAYMENT_GATEWAY_RETRY_BACKOFF_MS: number = 250;

  @IsInt()
  @Min(0)
  BASE_FEE_IN_CENTS: number = 250_000;

  @IsInt()
  @Min(0)
  DELIVERY_FEE_IN_CENTS: number = 800_000;
}

export const validateEnv = (
  config: Record<string, unknown>,
): EnvironmentVariables => {
  const env = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(env);

  if (errors.length > 0) {
    const details = errors
      .map(
        (error) =>
          `${error.property}: ${Object.values(error.constraints ?? {}).join(', ')}`,
      )
      .join('\n');
    throw new Error(`Invalid environment variables:\n${details}`);
  }

  return env;
};
