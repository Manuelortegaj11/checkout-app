import { validateEnv } from './env.validation';

const DATABASE_URL =
  'postgresql://checkout:checkout@localhost:5433/checkout?schema=public';

describe('validateEnv', () => {
  it('usa valores por defecto para lo que no es obligatorio', () => {
    const env = validateEnv({ DATABASE_URL });

    expect(env.NODE_ENV).toBe('development');
    expect(env.PORT).toBe(3001);
    expect(env.CORS_ORIGIN).toBe('http://localhost:3000');
    expect(env.DATABASE_URL).toBe(DATABASE_URL);
  });

  it('convierte PORT de texto a número', () => {
    const env = validateEnv({ DATABASE_URL, PORT: '8080' });

    expect(env.PORT).toBe(8080);
  });

  it('acepta una configuración de producción válida', () => {
    const env = validateEnv({
      NODE_ENV: 'production',
      PORT: '3001',
      CORS_ORIGIN: 'https://checkout.example.com',
      DATABASE_URL: 'postgres://api:s3cret@db.internal:5432/checkout',
    });

    expect(env.NODE_ENV).toBe('production');
    expect(env.CORS_ORIGIN).toBe('https://checkout.example.com');
  });

  it('exige DATABASE_URL', () => {
    expect(() => validateEnv({})).toThrow('DATABASE_URL');
  });

  it.each([
    [{ PORT: '0' }, 'PORT'],
    [{ PORT: 'abc' }, 'PORT'],
    [{ NODE_ENV: 'staging' }, 'NODE_ENV'],
    [{ CORS_ORIGIN: 'not-a-url' }, 'CORS_ORIGIN'],
    [{ DATABASE_URL: 'mysql://root@localhost/db' }, 'DATABASE_URL'],
  ])('rechaza %j indicando la variable inválida', (config, variable) => {
    expect(() => validateEnv({ DATABASE_URL, ...config })).toThrow(variable);
  });
});
