import { validateEnv } from './env.validation';

describe('validateEnv', () => {
  it('usa valores por defecto si no se definen', () => {
    const env = validateEnv({});

    expect(env.NODE_ENV).toBe('development');
    expect(env.PORT).toBe(3001);
    expect(env.CORS_ORIGIN).toBe('http://localhost:3000');
  });

  it('convierte PORT de texto a número', () => {
    const env = validateEnv({ PORT: '8080' });

    expect(env.PORT).toBe(8080);
  });

  it('acepta una configuración de producción válida', () => {
    const env = validateEnv({
      NODE_ENV: 'production',
      PORT: '3001',
      CORS_ORIGIN: 'https://checkout.example.com',
    });

    expect(env.NODE_ENV).toBe('production');
    expect(env.CORS_ORIGIN).toBe('https://checkout.example.com');
  });

  it.each([
    [{ PORT: '0' }, 'PORT'],
    [{ PORT: 'abc' }, 'PORT'],
    [{ NODE_ENV: 'staging' }, 'NODE_ENV'],
    [{ CORS_ORIGIN: 'not-a-url' }, 'CORS_ORIGIN'],
  ])('rechaza %j indicando la variable inválida', (config, variable) => {
    expect(() => validateEnv(config)).toThrow(variable);
  });
});
