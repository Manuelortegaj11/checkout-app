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

export interface TransactionRepositoryPort {
  create(transaction: Transaction): ResultAsync<void, AppError>;

  findViewById(id: string): ResultAsync<TransactionView | null, AppError>;

  claimPaymentSubmission(
    transaction: Transaction,
  ): ResultAsync<PaymentSubmissionClaim, AppError>;

  savePaymentResult(transaction: Transaction): ResultAsync<void, AppError>;
}
