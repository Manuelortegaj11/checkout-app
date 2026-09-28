import {
  initialCheckoutState,
  type CheckoutState,
} from '@features/checkout/checkout.slice';
import type { CheckoutConfig } from '@shared/api/checkout.api';
import type {
  CardDetails,
  TokenizedCard,
} from '@shared/api/payment-gateway.api';
import type { RootState } from '@store/index';

export const aCheckoutState = (
  overrides: Partial<CheckoutState> = {},
): RootState['checkout'] => ({
  ...initialCheckoutState,
  ...overrides,
  _persist: { version: 1, rehydrated: true },
});

export const aCheckoutConfig = (
  overrides: Partial<CheckoutConfig> = {},
): CheckoutConfig => ({
  currency: 'COP',
  baseFeeInCents: 250_000,
  deliveryFeeInCents: 800_000,
  acceptance: {
    endUserPolicy: {
      token: 'end-user-policy-token',
      url: 'https://gateway.test/docs/end-user-policy.pdf',
    },
    personalDataAuth: {
      token: 'personal-data-auth-token',
      url: 'https://gateway.test/docs/personal-data-auth.pdf',
    },
  },
  paymentGateway: {
    baseUrl: 'https://gateway.test/v1',
    publicKey: 'pub_test_abc123',
  },
  ...overrides,
});

export const aCardDetails = (
  overrides: Partial<CardDetails> = {},
): CardDetails => ({
  number: '4242424242424242',
  cvc: '123',
  expMonth: '12',
  expYear: '29',
  holder: 'Ana Gómez',
  ...overrides,
});

export const aTokenizedCard = (
  overrides: Partial<TokenizedCard> = {},
): TokenizedCard => ({
  token: 'tok_test_4242',
  brand: 'VISA',
  last4: '4242',
  ...overrides,
});
