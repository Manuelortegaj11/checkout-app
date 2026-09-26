import {
  TRANSACTION_STATUS,
  type FinalTransactionStatus,
  type TransactionStatus,
} from '@domain/constants/transaction.constants';

const STATUSES: readonly string[] = Object.values(TRANSACTION_STATUS);

/** El valor es uno de los estados que maneja el negocio (útil con datos externos). */
export const isTransactionStatus = (
  value: unknown,
): value is TransactionStatus =>
  typeof value === 'string' && STATUSES.includes(value);

/** La transacción ya tiene resultado: aprobada, rechazada, anulada o con error. */
export const isFinalStatus = (
  status: TransactionStatus,
): status is FinalTransactionStatus => status !== TRANSACTION_STATUS.PENDING;
