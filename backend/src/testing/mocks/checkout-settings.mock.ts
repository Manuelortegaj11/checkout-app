import type {
  CheckoutFees,
  CheckoutSettingsPort,
} from '@application/ports/checkout-settings.port';
import { CHECKOUT_FEES } from '@testing/fixtures/checkout.fixture';

export const mockCheckoutSettings = (
  fees: CheckoutFees = CHECKOUT_FEES,
): jest.Mocked<CheckoutSettingsPort> => ({
  getFees: jest.fn().mockReturnValue(fees),
});
