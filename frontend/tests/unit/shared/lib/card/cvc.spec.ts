import { isValidCvc } from '@shared/lib/card/cvc';

describe('isValidCvc', () => {
  it('acepta 3 dígitos', () => {
    expect(isValidCvc('123')).toBe(true);
  });

  it.each(['12', '1234', '12a', ''])('rechaza %p', (cvc) => {
    expect(isValidCvc(cvc)).toBe(false);
  });
});
