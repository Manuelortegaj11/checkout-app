import { integritySignature } from '@infrastructure/payment-gateway/integrity-signature';

const payment = {
  reference: 'TX-019200000000700080000000000000A1',
  amountInCents: 20_040_000,
  currency: 'COP',
};
const SECRET = 'test_integrity_0123456789abcdef';

describe('integritySignature', () => {
  it('es el SHA-256 de referencia + monto + moneda + secreto', () => {
    // Vector calculado aparte con `sha256sum`.
    expect(integritySignature(payment, SECRET)).toBe(
      'b8214e49d7069222339f4940a3807161230a4a24c8bf11379eed276072125dcf',
    );
  });

  it.each([
    ['la referencia', { ...payment, reference: 'TX-OTRA' }],
    ['el monto', { ...payment, amountInCents: 20_040_001 }],
    ['la moneda', { ...payment, currency: 'USD' }],
  ])('cambia si cambia %s', (_field, altered) => {
    expect(integritySignature(altered, SECRET)).not.toBe(
      integritySignature(payment, SECRET),
    );
  });
});
