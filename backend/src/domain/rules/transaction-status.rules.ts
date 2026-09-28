import {
  TRANSACTION_STATUS,
  type FinalTransactionStatus,
  type TransactionStatus,
} from '@domain/constants/transaction.constants';

const STATUSES: readonly string[] = Object.values(TRANSACTION_STATUS);

export const isTransactionStatus = (
  value: unknown,
): value is TransactionStatus =>
  typeof value === 'string' && STATUSES.includes(value);

export const isFinalStatus = (
  status: TransactionStatus,
): status is FinalTransactionStatus => status !== TRANSACTION_STATUS.PENDING;
