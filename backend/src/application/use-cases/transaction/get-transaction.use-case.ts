import type { GetTransactionInput } from '@application/dtos/transaction/get-transaction.input';
import type { TransactionOutput } from '@application/dtos/transaction/transaction.output';
import type { TransactionView } from '@application/dtos/transaction/transaction-view';
import type { ClockPort } from '@application/ports/clock.port';
import type { PaymentGatewayPort } from '@application/ports/payment-gateway.port';
import type { TransactionRepositoryPort } from '@application/ports/transaction.repository.port';
import type { UseCase } from '@application/ports/use-case.port';
import type { PaymentResult } from '@domain/entities/transaction.entity';
import { transactionNotFound } from '@domain/errors/transaction.errors';
import { isFinalStatus } from '@domain/rules/transaction-status.rules';
import type { AppError } from '@shared/errors/app-error';
import { fromNullable, okAsync, type ResultAsync } from '@shared/result';
import { recordPaymentResult } from './record-payment-result';
import { toTransactionOutput } from './transaction.mapper';

/**
 * Devuelve la transacción. Si tiene un cobro pendiente, antes pregunta a la
 * pasarela y, si ya es final, la liquida. Idempotente: repetirla no cambia
 * el resultado.
 */
export class GetTransactionUseCase implements UseCase<
  GetTransactionInput,
  TransactionOutput
> {
  constructor(
    private readonly transactions: TransactionRepositoryPort,
    private readonly paymentGateway: PaymentGatewayPort,
    private readonly clock: ClockPort,
  ) {}

  execute({
    transactionId,
  }: GetTransactionInput): ResultAsync<TransactionOutput, AppError> {
    return this.transactions
      .findViewById(transactionId)
      .andThen((view) =>
        fromNullable(view, () => transactionNotFound(transactionId)),
      )
      .andThen((view) => this.synchronize(view))
      .map(toTransactionOutput);
  }

  /** Liquida la transacción si la pasarela ya tiene el resultado final del cobro. */
  private synchronize(
    view: TransactionView,
  ): ResultAsync<TransactionView, AppError> {
    const paymentId = view.transaction.pendingPaymentId();
    if (paymentId === null) {
      return okAsync(view);
    }

    return this.fetchPayment(paymentId).andThen((payment) =>
      payment !== null && isFinalStatus(payment.status)
        ? recordPaymentResult(
            this.transactions,
            view,
            payment,
            this.clock.now(),
          )
        : okAsync(view),
    );
  }

  /**
   * Si la pasarela no responde no es un error: se devuelve la transacción tal
   * como está (PENDING) y el cliente vuelve a consultar.
   */
  private fetchPayment(
    paymentId: string,
  ): ResultAsync<PaymentResult | null, never> {
    return this.paymentGateway
      .getPayment(paymentId)
      .map((payment): PaymentResult | null => payment)
      .orElse(() => okAsync(null));
  }
}
