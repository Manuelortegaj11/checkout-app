// La conversión implícita de tipos lee la metadata de los decoradores.
import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { IsIn, IsInt, IsUrl, Max, Min, validateSync } from 'class-validator';

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
