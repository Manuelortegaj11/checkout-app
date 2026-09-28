import { detectCardBrand, isCardBrand } from '@shared/lib/card/card-brand';

describe('detectCardBrand', () => {
  it.each([
    ['4', 'VISA'],
    ['4242424242424242', 'VISA'],
    ['51', 'MASTERCARD'],
    ['5555555555554444', 'MASTERCARD'],
    ['2221', 'MASTERCARD'],
    ['2720999999999999', 'MASTERCARD'],
  ])('%s es %s', (digits, brand) => {
    expect(detectCardBrand(digits)).toBe(brand);
  });

  it.each([
    ['vacío', ''],
    ['todavía ambiguo', '2'],
    ['MasterCard serie 2 incompleta', '222'],
    ['fuera del rango 51–55', '5600000000000000'],
    ['fuera del rango 2221–2720', '2721000000000000'],
    ['American Express', '378282246310005'],
  ])('no reconoce %s', (_case, digits) => {
    expect(detectCardBrand(digits)).toBeNull();
  });
});

describe('isCardBrand', () => {
  it.each(['VISA', 'MASTERCARD'])('%s es una marca conocida', (value) => {
    expect(isCardBrand(value)).toBe(true);
  });

  it.each(['AMEX', 'visa', ''])('%p no lo es', (value) => {
    expect(isCardBrand(value)).toBe(false);
  });
});
