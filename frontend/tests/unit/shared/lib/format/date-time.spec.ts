import { formatDateTime } from '@shared/lib/format/date-time';

// Intl separa la hora y "a. m." con espacios especiales: se normalizan para comparar.
const normalized = (text: string) => text.replace(/\s/g, ' ');

describe('formatDateTime', () => {
  it('muestra la fecha y la hora de Colombia (UTC−5)', () => {
    expect(normalized(formatDateTime('2026-09-26T15:04:09.000Z'))).toBe(
      '26 de septiembre de 2026 a las 10:04 a. m.',
    );
  });

  it('una hora UTC de madrugada cae el día anterior en Colombia', () => {
    expect(normalized(formatDateTime('2026-09-27T02:30:00.000Z'))).toBe(
      '26 de septiembre de 2026 a las 9:30 p. m.',
    );
  });
});
