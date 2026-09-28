export const CHECKOUT_STEP = {
  PRODUCT: 'PRODUCT',
  PAYMENT_FORM: 'PAYMENT_FORM',
  SUMMARY: 'SUMMARY',
  PROCESSING: 'PROCESSING',
  RESULT: 'RESULT',
} as const;

export type CheckoutStep = (typeof CHECKOUT_STEP)[keyof typeof CHECKOUT_STEP];

export const MAX_QUANTITY_PER_PURCHASE = 10;
