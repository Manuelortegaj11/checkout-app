import type { CheckoutFees } from '@application/ports/checkout-settings.port';
import type { AcceptanceContracts } from '@application/ports/payment-gateway.port';

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
