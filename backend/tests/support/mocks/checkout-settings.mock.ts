import type { CheckoutSettingsPort } from '@application/ports/checkout-settings.port';
import type { CheckoutFees } from '@domain/rules/pricing.rules';
import { CHECKOUT_FEES } from '@testing/fixtures/checkout.fixture';

export const mockCheckoutSettings = (
  fees: CheckoutFees = CHECKOUT_FEES,
): jest.Mocked<CheckoutSettingsPort> => ({
  getFees: jest.fn().mockReturnValue(fees),
});
