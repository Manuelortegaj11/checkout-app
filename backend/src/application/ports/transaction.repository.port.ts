import type { TransactionView } from '@application/dtos/transaction/transaction-view';
import type { Transaction } from '@domain/entities/transaction.entity';
import type { AppError } from '@shared/errors/app-error';
import type { ResultAsync } from '@shared/result';

export const TRANSACTION_REPOSITORY = Symbol('TRANSACTION_REPOSITORY');

export type PaymentSubmissionClaim =
  | { readonly claimed: true }
  | {
      readonly claimed: false;
      readonly reason: 'ALREADY_SUBMITTED';
    }
  | {
      readonly claimed: false;
      readonly reason: 'OUT_OF_STOCK';
      readonly available: number;
    };

/** Persistencia del agregado Transaction (con su entrega). */
export interface TransactionRepositoryPort {
  /** Guarda una transacción nueva y su entrega de forma atómica. */
  create(transaction: Transaction): ResultAsync<void, AppError>;

  /** La transacción con su producto y su cliente, o `null` si no existe. */
  findViewById(id: string): ResultAsync<TransactionView | null, AppError>;

  /**
   * Reclama el envío y reserva el stock en una sola transacción de base de
   * datos. Solo una petición puede reclamar la compra y solo lo consigue si
   * todavía quedan las unidades solicitadas.
   */
  claimPaymentSubmission(
    transaction: Transaction,
  ): ResultAsync<PaymentSubmissionClaim, AppError>;

  /**
   * Guarda la respuesta de la pasarela. Si el estado es final, liquida en una
   * sola transacción de base de datos: estado, entrega y devolución del stock
   * reservado cuando no se aprobó. Idempotente: si otra petición ya la liquidó,
   * no hace nada.
   */
  savePaymentResult(transaction: Transaction): ResultAsync<void, AppError>;
}
