import type { CheckoutConfigOutput } from '@application/dtos/checkout/checkout-config.output';
import type { AcceptanceContracts } from '@application/ports/payment-gateway.port';
import { STORE_CURRENCY } from '@domain/constants/currency.constants';
import type { CheckoutFees } from '@domain/rules/pricing.rules';

export const CHECKOUT_FEES: CheckoutFees = {
  baseFeeInCents: 250_000,
  deliveryFeeInCents: 800_000,
};

export const anAcceptanceContracts = (): AcceptanceContracts => ({
  endUserPolicy: {
    token: 'end-user-policy-token',
    url: 'https://gateway.test/docs/end-user-policy.pdf',
  },
  personalDataAuth: {
    token: 'personal-data-auth-token',
    url: 'https://gateway.test/docs/personal-data-auth.pdf',
  },
});

/** Tarifas y contratos tal como los devuelve el caso de uso de configuración. */
export const aCheckoutConfigOutput = (): CheckoutConfigOutput => ({
  currency: STORE_CURRENCY,
  ...CHECKOUT_FEES,
  acceptance: anAcceptanceContracts(),
});
