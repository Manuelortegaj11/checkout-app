import { formatExpiry, isExpired, parseExpiry } from '@shared/lib/card/expiry';

describe('formatExpiry', () => {
  it.each([
    ['', ''],
    ['1', '1'],
    ['12', '12'],
    ['122', '12/2'],
    ['1229', '12/29'],
    ['12/29', '12/29'],
    ['122999', '12/29'],
  ])('%p se muestra como %p', (value, formatted) => {
    expect(formatExpiry(value)).toBe(formatted);
  });
});

describe('parseExpiry', () => {
  it('convierte MM/AA en mes y año completo', () => {
    expect(parseExpiry('09/29')).toEqual({ month: 9, year: 2029 });
  });

  it.each(['00/29', '13/29', '9/29', '0929', '12/2', ''])(
    'rechaza %p',
    (value) => {
      expect(parseExpiry(value)).toBeNull();
    },
  );
});

describe('isExpired', () => {
  const now = new Date(2026, 8, 15);

  it.each([
    [{ month: 9, year: 2026 }, false],
    [{ month: 10, year: 2026 }, false],
    [{ month: 1, year: 2027 }, false],
    [{ month: 8, year: 2026 }, true],
    [{ month: 12, year: 2025 }, true],
  ])('%o vencida: %p', (expiry, expired) => {
    expect(isExpired(expiry, now)).toBe(expired);
  });
});
