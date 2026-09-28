import { SystemClock } from '@infrastructure/system/system-clock';

describe('SystemClock', () => {
  it('devuelve la hora actual', () => {
    const before = Date.now();

    const now = new SystemClock().now().getTime();

    expect(now).toBeGreaterThanOrEqual(before);
    expect(now).toBeLessThanOrEqual(Date.now());
  });
});
