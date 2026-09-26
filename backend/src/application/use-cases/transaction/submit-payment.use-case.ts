import type { SubmitPaymentInput } from '@application/dtos/transaction/submit-payment.input';
import type { TransactionOutput } from '@application/dtos/transaction/transaction.output';
import type { TransactionView } from '@application/dtos/transaction/transaction-view';
import type { ClockPort } from '@application/ports/clock.port';
import type { PaymentGatewayPort } from '@application/ports/payment-gateway.port';
import type { TransactionRepositoryPort } from '@application/ports/transaction.repository.port';
import type { UseCase } from '@application/ports/use-case.port';
import type { PaymentResult } from '@domain/entities/transaction.entity';
import {
  paymentAlreadySubmitted,
  transactionNotFound,
} from '@domain/errors/transaction.errors';
import { checkStockAvailable } from '@domain/rules/stock.rules';
import type { AppError } from '@shared/errors/app-error';
import {
  err,
  errAsync,
  fromNullable,
  ok,
  okAsync,
  type Result,
  type ResultAsync,
} from '@shared/result';
import { recordPaymentResult } from './record-payment-result';
import { toTransactionOutput } from './transaction.mapper';

/**
 * Cobra una transacción PENDING con la tarjeta tokenizada. Un pago rechazado
 * (DECLINED) es un resultado válido y viaja por el riel de éxito; solo es un
 * error lo que impide cobrar (estado, stock, doble envío o la pasarela).
 */
export class SubmitPaymentUseCase implements UseCase<
  SubmitPaymentInput,
  TransactionOutput
> {
  constructor(
    private readonly transactions: TransactionRepositoryPort,
    private readonly paymentGateway: PaymentGatewayPort,
    private readonly clock: ClockPort,
  ) {}

  execute(input: SubmitPaymentInput): ResultAsync<TransactionOutput, AppError> {
    return this.transactions
      .findViewById(input.transactionId)
      .andThen((view) =>
        fromNullable(view, () => transactionNotFound(input.transactionId)),
      )
      .andThen((view) => this.startPayment(view))
      .andThen((view) => this.claimSubmission(view))
      .andThen((view) =>
        this.charge(view, input).map((payment) => ({ view, payment })),
      )
      .andThen(({ view, payment }) =>
        recordPaymentResult(this.transactions, view, payment, this.clock.now()),
      )
      .map(toTransactionOutput);
  }

  /** Se cobra una sola vez, mientras siga PENDING y quede stock. */
  private startPayment(
    view: TransactionView,
  ): Result<TransactionView, AppError> {
    const { quantity } = view.transaction.toPlainObject();

    return view.transaction
      .startPayment(this.clock.now())
      .andThen((transaction) =>
        checkStockAvailable(view.product.toPlainObject(), quantity).map(() => ({
          ...view,
          transaction,
        })),
      );
  }

  /** Reserva atómica del envío: si otra petición se adelantó, no se cobra dos veces. */
  private claimSubmission(
    view: TransactionView,
  ): ResultAsync<TransactionView, AppError> {
    return this.transactions
      .claimPaymentSubmission(view.transaction)
      .andThen((claimed) =>
        claimed ? ok(view) : err(paymentAlreadySubmitted(view.transaction.id)),
      );
  }

  /**
   * Envía el cobro. Si la pasarela lo rechaza o no responde, la compra termina
   * en ERROR (compensación) y se devuelve el error original.
   */
  private charge(
    view: TransactionView,
    input: SubmitPaymentInput,
  ): ResultAsync<PaymentResult, AppError> {
    const { reference, amounts, currency } = view.transaction.toPlainObject();

    return this.paymentGateway
      .charge({
        reference,
        amountInCents: amounts.totalInCents,
        currency,
        customerEmail: view.customer.toPlainObject().email,
        cardToken: input.cardToken,
        installments: input.installments,
        acceptanceToken: input.acceptanceToken,
        personalDataAuthToken: input.personalDataAuthToken,
      })
      .orElse((error) =>
        this.failPayment(view, error).andThen(() => errAsync(error)),
      );
  }

  /**
   * Compensación: la compra termina en ERROR con el motivo. Si ni eso se puede
   * guardar, prevalece el error original de la pasarela.
   */
  private failPayment(
    view: TransactionView,
    error: AppError,
  ): ResultAsync<void, never> {
    return view.transaction
      .failPayment(error.message, this.clock.now())
      .asyncAndThen((failed) => this.transactions.savePaymentResult(failed))
      .orElse(() => okAsync(undefined));
  }
}
