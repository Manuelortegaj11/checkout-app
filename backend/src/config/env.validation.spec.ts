import { validateEnv } from './env.validation';

/** Variables obligatorias: sin ellas la API no arranca. */
const REQUIRED = {
  DATABASE_URL:
    'postgresql://checkout:checkout@localhost:5433/checkout?schema=public',
  PAYMENT_GATEWAY_BASE_URL: 'https://gateway.test/v1',
  PAYMENT_GATEWAY_PUBLIC_KEY: 'pub_test_abc123',
};

describe('validateEnv', () => {
  it('usa valores por defecto para lo que no es obligatorio', () => {
    const env = validateEnv(REQUIRED);

    expect(env).toMatchObject({
      ...REQUIRED,
      NODE_ENV: 'development',
      PORT: 3001,
      CORS_ORIGIN: 'http://localhost:3000',
      PAYMENT_GATEWAY_TIMEOUT_MS: 10_000,
      BASE_FEE_IN_CENTS: 250_000,
      DELIVERY_FEE_IN_CENTS: 800_000,
    });
  });

  it('convierte los números que llegan como texto', () => {
    const env = validateEnv({
      ...REQUIRED,
      PORT: '8080',
      PAYMENT_GATEWAY_TIMEOUT_MS: '5000',
      BASE_FEE_IN_CENTS: '0',
      DELIVERY_FEE_IN_CENTS: '1200000',
    });

    expect(env).toMatchObject({
      PORT: 8080,
      PAYMENT_GATEWAY_TIMEOUT_MS: 5_000,
      BASE_FEE_IN_CENTS: 0,
      DELIVERY_FEE_IN_CENTS: 1_200_000,
    });
  });

  it('acepta una configuración de producción válida', () => {
    const env = validateEnv({
      ...REQUIRED,
      NODE_ENV: 'production',
      CORS_ORIGIN: 'https://checkout.example.com',
      DATABASE_URL: 'postgres://api:s3cret@db.internal:5432/checkout',
    });

    expect(env.NODE_ENV).toBe('production');
    expect(env.CORS_ORIGIN).toBe('https://checkout.example.com');
  });

  it.each(Object.keys(REQUIRED))('exige %s', (variable) => {
    const config: Record<string, unknown> = { ...REQUIRED };
    delete config[variable];

    expect(() => validateEnv(config)).toThrow(variable);
  });

  it.each([
    [{ PORT: '0' }, 'PORT'],
    [{ PORT: 'abc' }, 'PORT'],
    [{ NODE_ENV: 'staging' }, 'NODE_ENV'],
    [{ CORS_ORIGIN: 'not-a-url' }, 'CORS_ORIGIN'],
    [{ DATABASE_URL: 'mysql://root@localhost/db' }, 'DATABASE_URL'],
    [
      { PAYMENT_GATEWAY_BASE_URL: 'http://gateway.test/v1' },
      'PAYMENT_GATEWAY_BASE_URL',
    ],
    [
      { PAYMENT_GATEWAY_PUBLIC_KEY: 'prv_test_abc123' },
      'PAYMENT_GATEWAY_PUBLIC_KEY',
    ],
    [{ PAYMENT_GATEWAY_TIMEOUT_MS: '100' }, 'PAYMENT_GATEWAY_TIMEOUT_MS'],
    [{ BASE_FEE_IN_CENTS: '-1' }, 'BASE_FEE_IN_CENTS'],
    [{ DELIVERY_FEE_IN_CENTS: '10.5' }, 'DELIVERY_FEE_IN_CENTS'],
  ])('rechaza %j indicando la variable inválida', (config, variable) => {
    expect(() => validateEnv({ ...REQUIRED, ...config })).toThrow(variable);
  });
});
