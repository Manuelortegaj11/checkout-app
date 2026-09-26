import { passesLuhn } from '@shared/lib/card/luhn';

describe('passesLuhn', () => {
  it.each([
    '4242424242424242', // VISA de prueba (aprobada en el Sandbox)
    '4111111111111111', // VISA de prueba (rechazada en el Sandbox)
    '5555555555554444', // MasterCard de prueba
    '2223003122003222', // MasterCard serie 2
    '79927398713', // ejemplo clásico del algoritmo
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
