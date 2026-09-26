import { createHash } from 'node:crypto';

export interface SignedPayment {
  readonly reference: string;
  readonly amountInCents: number;
  readonly currency: string;
}

/**
 * Firma de integridad que la pasarela exige en cada cobro:
 * SHA-256 (hex) de `referencia + monto en centavos + moneda + secreto`.
 * Impide que alguien altere el monto o la referencia por el camino.
 */
export const integritySignature = (
  { reference, amountInCents, currency }: SignedPayment,
  secret: string,
): string =>
  createHash('sha256')
    .update(`${reference}${amountInCents}${currency}${secret}`)
    .digest('hex');
