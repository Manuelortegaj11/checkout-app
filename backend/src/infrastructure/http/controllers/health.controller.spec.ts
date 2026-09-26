import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('responde que la API está en marcha', () => {
    expect(new HealthController().check()).toEqual({ status: 'ok' });
  });
});
