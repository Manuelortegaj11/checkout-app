import type { SubmitPaymentInput } from '@application/dtos/transaction/submit-payment.input';
import type { TransactionOutput } from '@application/dtos/transaction/transaction.output';
import type { TransactionView } from '@application/dtos/transaction/transaction-view';
import type { ClockPort } from '@application/ports/clock.port';
import {
  PAYMENT_GATEWAY_ERROR_CODE,
  type PaymentGatewayPort,
} from '@application/ports/payment-gateway.port';
import type { TransactionRepositoryPort } from '@application/ports/transaction.repository.port';
import type { UseCase } from '@application/ports/use-case.port';
import type { PaymentResult } from '@domain/entities/transaction.entity';
import { outOfStock } from '@domain/errors/product.errors';
import {
  paymentAlreadySubmitted,
  transactionNotFound,
} from '@domain/errors/transaction.errors';
import { isFinalStatus } from '@domain/rules/transaction-status.rules';
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
        recordPaymentResult(
          this.transactions,
          view,
          payment,
          this.clock.now(),
        ).map((recorded) => ({ view: recorded, payment })),
      )
      .andThen(({ view, payment }) => this.waitForFinalResult(view, payment))
      .map(toTransactionOutput);
  }

  private startPayment(
    view: TransactionView,
  ): Result<TransactionView, AppError> {
    return view.transaction
      .startPayment(this.clock.now())
      .map((transaction) => ({ ...view, transaction }));
  }

  private claimSubmission(
    view: TransactionView,
  ): ResultAsync<TransactionView, AppError> {
    return this.transactions
      .claimPaymentSubmission(view.transaction)
      .andThen((claim) => {
        if (claim.claimed) {
          return ok(view);
        }
        if (claim.reason === 'ALREADY_SUBMITTED') {
          return err(paymentAlreadySubmitted(view.transaction.id));
        }

        const { productId, quantity } = view.transaction.toPlainObject();
        return err(outOfStock(productId, quantity, claim.available));
      });
  }

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
      .orElse((error) => {
        if (error.code !== PAYMENT_GATEWAY_ERROR_CODE.REJECTED) {
          return errAsync(error);
        }

        return this.failPayment(view, error).andThen(() => errAsync(error));
      });
  }

  private waitForFinalResult(
    view: TransactionView,
    payment: PaymentResult,
  ): ResultAsync<TransactionView, AppError> {
    if (isFinalStatus(payment.status)) {
      return okAsync(view);
    }

    return this.paymentGateway
      .waitForFinalStatus(payment)
      .andThen((latest) =>
        isFinalStatus(latest.status)
          ? recordPaymentResult(
              this.transactions,
              view,
              latest,
              this.clock.now(),
            )
          : okAsync(view),
      );
  }

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
