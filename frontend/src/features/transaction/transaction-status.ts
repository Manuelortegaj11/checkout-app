import type { TransactionStatus } from '@shared/api/transactions.api';

/** Una transacción sale de PENDING una sola vez: los demás estados ya no cambian. */
export const isFinalStatus = (status: TransactionStatus): boolean =>
  status !== 'PENDING';
