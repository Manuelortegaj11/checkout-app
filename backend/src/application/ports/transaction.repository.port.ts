import type { Transaction } from '@domain/entities/transaction.entity';
import type { AppError } from '@shared/errors/app-error';
import type { ResultAsync } from '@shared/result';

export const TRANSACTION_REPOSITORY = Symbol('TRANSACTION_REPOSITORY');

/** Persistencia del agregado Transaction (con su entrega). */
export interface TransactionRepositoryPort {
  /** Guarda una transacción nueva y su entrega de forma atómica. */
  create(transaction: Transaction): ResultAsync<void, AppError>;
}
