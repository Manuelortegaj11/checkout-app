import {
  digitsOnly,
  formatCardNumber,
  lastFourDigits,
} from '@shared/lib/card/card-number';

describe('digitsOnly', () => {
  it('quita espacios, guiones y cualquier otro carácter', () => {
    expect(digitsOnly('4242-4242 4242.4242')).toBe('4242424242424242');
  });
});

describe('formatCardNumber', () => {
  it.each([
    ['', ''],
    ['4242', '4242'],
    ['42424', '4242 4'],
    ['4242424242424242', '4242 4242 4242 4242'],
    ['4242 4242-4242', '4242 4242 4242'],
    ['4242424242424242424', '4242 4242 4242 4242 424'],
  ])('%p se muestra como %p', (value, formatted) => {
    expect(formatCardNumber(value)).toBe(formatted);
  });

  it('corta en 19 dígitos, el máximo de una tarjeta', () => {
    expect(digitsOnly(formatCardNumber('4'.repeat(25)))).toHaveLength(19);
  });
});

describe('lastFourDigits', () => {
  it('devuelve los últimos 4 dígitos', () => {
    expect(lastFourDigits('4242 4242 4242 1234')).toBe('1234');
  });
});
