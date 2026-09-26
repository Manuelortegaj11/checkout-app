/**
 * Pasos del checkout. La pantalla visible sale solo del paso guardado en el
 * store (sin router): al refrescar, la app vuelve exactamente a donde estaba.
 */
export const CHECKOUT_STEP = {
  PRODUCT: 'PRODUCT',
  PAYMENT_FORM: 'PAYMENT_FORM',
  SUMMARY: 'SUMMARY',
  PROCESSING: 'PROCESSING',
  RESULT: 'RESULT',
} as const;

export type CheckoutStep = (typeof CHECKOUT_STEP)[keyof typeof CHECKOUT_STEP];

/** Unidades máximas por compra: la misma regla que aplica el backend. */
export const MAX_QUANTITY_PER_PURCHASE = 10;
