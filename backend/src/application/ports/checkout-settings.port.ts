import type { CheckoutFees } from '@domain/rules/pricing.rules';

export const CHECKOUT_SETTINGS = Symbol('CHECKOUT_SETTINGS');

export interface CheckoutSettingsPort {
  getFees(): CheckoutFees;
}
