import type { TransactionView } from '@application/dtos/transaction/transaction-view';
import type { TransactionRepositoryPort } from '@application/ports/transaction.repository.port';
import type { PaymentResult } from '@domain/entities/transaction.entity';
import type { AppError } from '@shared/errors/app-error';
import type { ResultAsync } from '@shared/result';

export const recordPaymentResult = (
  transactions: TransactionRepositoryPort,
  view: TransactionView,
  payment: PaymentResult,
  at: Date,
): ResultAsync<TransactionView, AppError> =>
  view.transaction
    .applyPaymentResult(payment, at)
    .asyncAndThen((transaction) =>
      transactions
        .savePaymentResult(transaction)
        .map(() => ({ ...view, transaction })),
    );
