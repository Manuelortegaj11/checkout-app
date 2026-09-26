/** Monedas del negocio (ISO 4217). */
export const CURRENCY = {
  COP: 'COP',
} as const;

export type Currency = (typeof CURRENCY)[keyof typeof CURRENCY];

/** Moneda en la que la tienda fija sus precios y cobra. */
export const STORE_CURRENCY: Currency = CURRENCY.COP;
