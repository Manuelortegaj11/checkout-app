// La conversión implícita de tipos lee la metadata de los decoradores.
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

  /** Obligatoria: sin base de datos la API no arranca. */
  @IsUrl({
    require_tld: false,
    require_protocol: true,
    protocols: ['postgresql', 'postgres'],
  })
  DATABASE_URL!: string;

  /** URL base de la API de la pasarela de pagos (Sandbox en esta prueba). */
  @IsUrl({ require_protocol: true, protocols: ['https'] })
  PAYMENT_GATEWAY_BASE_URL!: string;

  /** Llave pública del comercio: identifica la tienda ante la pasarela. */
  @Matches(/^pub_\w+$/, {
    message: 'PAYMENT_GATEWAY_PUBLIC_KEY must start with pub_',
  })
  PAYMENT_GATEWAY_PUBLIC_KEY!: string;

  /** Secreto de integridad: firma cada cobro. Solo lo conoce el backend. */
  @Matches(/^\S{16,}$/, {
    message:
      'PAYMENT_GATEWAY_INTEGRITY_SECRET must be at least 16 characters without spaces',
  })
  PAYMENT_GATEWAY_INTEGRITY_SECRET!: string;

  /** Tiempo máximo de espera de cada petición a la pasarela. */
  @IsInt()
  @Min(1_000)
  @Max(60_000)
  PAYMENT_GATEWAY_TIMEOUT_MS: number = 10_000;

  /** Cuánto espera el cobro un resultado final antes de responder PENDING. */
  @IsInt()
  @Min(0)
  @Max(30_000)
  PAYMENT_GATEWAY_POLL_TIMEOUT_MS: number = 10_000;

  /** Cada cuánto se consulta el estado mientras se espera. */
  @IsInt()
  @Min(250)
  @Max(10_000)
  PAYMENT_GATEWAY_POLL_INTERVAL_MS: number = 1_000;

  /** Tarifa base que se cobra en cada compra, en centavos. */
  @IsInt()
  @Min(0)
  BASE_FEE_IN_CENTS: number = 250_000;

  /** Tarifa de envío, en centavos. */
  @IsInt()
  @Min(0)
  DELIVERY_FEE_IN_CENTS: number = 800_000;
}

/**
 * Valida `process.env` al arrancar. Si falta o sobra algo inválido, la API
 * no arranca: es preferible fallar al inicio que en mitad de un pago.
 */
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
