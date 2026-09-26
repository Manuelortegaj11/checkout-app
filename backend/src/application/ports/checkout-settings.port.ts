import type { CheckoutFees } from '@domain/rules/pricing.rules';

export const CHECKOUT_SETTINGS = Symbol('CHECKOUT_SETTINGS');

/**
 * Parámetros comerciales del checkout. Se validan al arrancar la API,
 * así que leerlos nunca falla y no necesitan el riel de ROP.
 */
export interface CheckoutSettingsPort {
  getFees(): CheckoutFees;
}
