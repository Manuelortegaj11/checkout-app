/** Estados de una transacción; coinciden con los de la pasarela de pagos. */
export const TRANSACTION_STATUS = {
  /** Creada y a la espera del resultado del pago. */
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  DECLINED: 'DECLINED',
  VOIDED: 'VOIDED',
  ERROR: 'ERROR',
} as const;

export type TransactionStatus =
  (typeof TRANSACTION_STATUS)[keyof typeof TRANSACTION_STATUS];

/** Unidades máximas de un producto en una sola compra. */
export const MAX_QUANTITY_PER_PURCHASE = 10;
