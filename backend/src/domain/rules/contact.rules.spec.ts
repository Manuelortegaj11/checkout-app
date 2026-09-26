import { normalizePersonName, normalizePhone } from './contact.rules';

describe('contact rules', () => {
  it.each([
    ['Ana Gómez', 'Ana Gómez'],
    ['  Ana Gómez  ', 'Ana Gómez'],
    ['Ana    María\tGómez', 'Ana María Gómez'],
  ])('normalizePersonName(%p) → %p', (raw, expected) => {
    expect(normalizePersonName(raw)).toBe(expected);
  });

  it.each([
    ['3001234567', '3001234567'],
    [' 300 123 4567 ', '3001234567'],
  ])('normalizePhone(%p) → %p', (raw, expected) => {
    expect(normalizePhone(raw)).toBe(expected);
  });
});
