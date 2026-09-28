import type { TransactionStatus } from '@shared/api/transactions.api';

export const isFinalStatus = (status: TransactionStatus): boolean =>
  status !== 'PENDING';
