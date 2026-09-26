export const CHECKOUT_SETTINGS = Symbol('CHECKOUT_SETTINGS');

/** Tarifas que se suman al valor del producto, en centavos. */
export interface CheckoutFees {
  /** Se cobra siempre, en cada compra. */
  readonly baseFeeInCents: number;
  readonly deliveryFeeInCents: number;
}

/**
 * Parámetros comerciales del checkout. Se validan al arrancar la API,
 * así que leerlos nunca falla y no necesitan el riel de ROP.
 */
export interface CheckoutSettingsPort {
  getFees(): CheckoutFees;
}
