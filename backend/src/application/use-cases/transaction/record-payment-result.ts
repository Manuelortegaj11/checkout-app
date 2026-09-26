import type { TransactionView } from '@application/dtos/transaction/transaction-view';
import type { TransactionRepositoryPort } from '@application/ports/transaction.repository.port';
import type { PaymentResult } from '@domain/entities/transaction.entity';
import type { AppError } from '@shared/errors/app-error';
import type { ResultAsync } from '@shared/result';

/**
 * Regla de liquidación compartida por el pago y la consulta: aplica la
 * respuesta de la pasarela a la transacción y la guarda. Si el estado es
 * final, eso liquida la compra (estado, entrega y stock) de forma atómica.
 */
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
