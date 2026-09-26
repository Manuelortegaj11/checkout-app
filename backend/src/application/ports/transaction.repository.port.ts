import type { TransactionView } from '@application/dtos/transaction/transaction-view';
import type { Transaction } from '@domain/entities/transaction.entity';
import type { AppError } from '@shared/errors/app-error';
import type { ResultAsync } from '@shared/result';

export const TRANSACTION_REPOSITORY = Symbol('TRANSACTION_REPOSITORY');

/** Persistencia del agregado Transaction (con su entrega). */
export interface TransactionRepositoryPort {
  /** Guarda una transacción nueva y su entrega de forma atómica. */
  create(transaction: Transaction): ResultAsync<void, AppError>;

  /** La transacción con su producto y su cliente, o `null` si no existe. */
  findViewById(id: string): ResultAsync<TransactionView | null, AppError>;

  /**
   * Reserva el envío del cobro de forma atómica: solo tiene éxito si la
   * transacción sigue PENDING y nadie lo envió antes. Devuelve `false` si otra
   * petición se adelantó, para no cobrar dos veces.
   */
  claimPaymentSubmission(
    transaction: Transaction,
  ): ResultAsync<boolean, AppError>;

  /**
   * Guarda la respuesta de la pasarela. Si el estado es final, liquida en una
   * sola transacción de base de datos: estado, entrega y, si se aprobó, stock.
   * Idempotente: si otra petición ya la liquidó, no hace nada.
   */
  savePaymentResult(transaction: Transaction): ResultAsync<void, AppError>;
}
