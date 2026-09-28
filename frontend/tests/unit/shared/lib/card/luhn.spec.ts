import { passesLuhn } from '@shared/lib/card/luhn';

describe('passesLuhn', () => {
  it.each([
    '4242424242424242',
    '4111111111111111',
    '5555555555554444',
    '2223003122003222',
    '79927398713',
  ])('acepta %s', (digits) => {
    expect(passesLuhn(digits)).toBe(true);
  });

  it.each([
    ['un dígito cambiado', '4242424242424241'],
    ['dos dígitos intercambiados', '4242424242424224'],
    ['texto', '4242abcd42424242'],
    ['vacío', ''],
  ])('rechaza %s', (_case, digits) => {
    expect(passesLuhn(digits)).toBe(false);
  });
});
