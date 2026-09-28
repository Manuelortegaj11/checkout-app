export const CURRENCY = {
  COP: 'COP',
} as const;

export type Currency = (typeof CURRENCY)[keyof typeof CURRENCY];

export const STORE_CURRENCY: Currency = CURRENCY.COP;
