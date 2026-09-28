import { createHash } from 'node:crypto';

export interface SignedPayment {
  readonly reference: string;
  readonly amountInCents: number;
  readonly currency: string;
}

export const integritySignature = (
  { reference, amountInCents, currency }: SignedPayment,
  secret: string,
): string =>
  createHash('sha256')
    .update(`${reference}${amountInCents}${currency}${secret}`)
    .digest('hex');
