export const TRANSACTION_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  DECLINED: 'DECLINED',
  VOIDED: 'VOIDED',
  ERROR: 'ERROR',
} as const;

export type TransactionStatus =
  (typeof TRANSACTION_STATUS)[keyof typeof TRANSACTION_STATUS];

export type FinalTransactionStatus = Exclude<
  TransactionStatus,
  typeof TRANSACTION_STATUS.PENDING
>;

export const MAX_INSTALLMENTS = 36;

export const MAX_QUANTITY_PER_PURCHASE = 10;
