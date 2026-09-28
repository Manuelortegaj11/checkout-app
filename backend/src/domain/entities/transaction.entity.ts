import {
  STORE_CURRENCY,
  type Currency,
} from '@domain/constants/currency.constants';
import {
  TRANSACTION_STATUS,
  type FinalTransactionStatus,
  type TransactionStatus,
} from '@domain/constants/transaction.constants';
import {
  paymentAlreadySubmitted,
  transactionAlreadyResolved,
} from '@domain/errors/transaction.errors';
import {
  calculateTransactionAmounts,
  type CheckoutFees,
  type TransactionAmounts,
} from '@domain/rules/pricing.rules';
import { isFinalStatus } from '@domain/rules/transaction-status.rules';
import type { Quantity } from '@domain/value-objects/quantity.vo';
import type { AppError } from '@shared/errors/app-error';
import { err, ok, type Result } from '@shared/result';
import {
  Delivery,
  type DeliveryAddress,
  type DeliveryProps,
} from './delivery.entity';

export interface TransactionProps {
  readonly id: string;

  readonly reference: string;
  readonly status: TransactionStatus;
  readonly productId: string;
  readonly customerId: string;
  readonly quantity: number;
  readonly currency: Currency;

  readonly amounts: TransactionAmounts;
  readonly delivery: DeliveryProps;
  readonly gatewayTransactionId: string | null;
  readonly paymentSubmittedAt: Date | null;
  readonly statusMessage: string | null;
  readonly finalizedAt: Date | null;
  readonly createdAt: Date;
}

export interface NewTransaction {
  readonly id: string;
  readonly productId: string;
  readonly customerId: string;
  readonly quantity: Quantity;
  readonly unitPriceInCents: number;
  readonly fees: CheckoutFees;
  readonly deliveryAddress: DeliveryAddress;
  readonly createdAt: Date;
}

export interface PaymentResult {
  readonly gatewayTransactionId: string;
  readonly status: TransactionStatus;

  readonly statusMessage: string | null;
}

type TransactionState = Omit<TransactionProps, 'delivery'> & {
  readonly delivery: Delivery;
};

const referenceFor = (transactionId: string): string =>
  `TX-${transactionId.replace(/-/g, '').toUpperCase()}`;

export class Transaction {
  private constructor(private readonly state: TransactionState) {}

  static create(input: NewTransaction): Transaction {
    return new Transaction({
      id: input.id,
      reference: referenceFor(input.id),
      status: TRANSACTION_STATUS.PENDING,
      productId: input.productId,
      customerId: input.customerId,
      quantity: input.quantity.value,
      currency: STORE_CURRENCY,
      amounts: calculateTransactionAmounts({
        unitPriceInCents: input.unitPriceInCents,
        quantity: input.quantity.value,
        fees: input.fees,
      }),
      delivery: Delivery.create(input.deliveryAddress),
      gatewayTransactionId: null,
      paymentSubmittedAt: null,
      statusMessage: null,
      finalizedAt: null,
      createdAt: input.createdAt,
    });
  }

  static reconstitute(props: TransactionProps): Transaction {
    return new Transaction({
      ...props,
      amounts: { ...props.amounts },
      delivery: Delivery.reconstitute(props.delivery),
    });
  }

  get id(): string {
    return this.state.id;
  }

  get status(): TransactionStatus {
    return this.state.status;
  }

  get gatewayTransactionId(): string | null {
    return this.state.gatewayTransactionId;
  }

  pendingPaymentId(): string | null {
    return this.state.status === TRANSACTION_STATUS.PENDING
      ? this.state.gatewayTransactionId
      : null;
  }

  startPayment(submittedAt: Date): Result<Transaction, AppError> {
    return this.ensurePending().andThen(() =>
      this.state.paymentSubmittedAt === null
        ? ok(this.with({ paymentSubmittedAt: submittedAt }))
        : err(paymentAlreadySubmitted(this.state.id)),
    );
  }

  applyPaymentResult(
    result: PaymentResult,
    at: Date,
  ): Result<Transaction, AppError> {
    return this.ensurePending().map(() => {
      const gateway = { gatewayTransactionId: result.gatewayTransactionId };

      return isFinalStatus(result.status)
        ? this.settle(result.status, result.statusMessage, at, gateway)
        : this.with(gateway);
    });
  }

  failPayment(reason: string, at: Date): Result<Transaction, AppError> {
    return this.ensurePending().map(() =>
      this.settle(TRANSACTION_STATUS.ERROR, reason, at),
    );
  }

  toPlainObject(): TransactionProps {
    return {
      ...this.state,
      amounts: { ...this.state.amounts },
      delivery: this.state.delivery.toPlainObject(),
    };
  }

  private ensurePending(): Result<void, AppError> {
    return this.state.status === TRANSACTION_STATUS.PENDING
      ? ok(undefined)
      : err(transactionAlreadyResolved(this.state.id));
  }

  private settle(
    status: FinalTransactionStatus,
    statusMessage: string | null,
    finalizedAt: Date,
    changes: Partial<TransactionState> = {},
  ): Transaction {
    return this.with({
      ...changes,
      status,
      statusMessage,
      finalizedAt,
      delivery: this.state.delivery.settle(
        status === TRANSACTION_STATUS.APPROVED,
      ),
    });
  }

  private with(changes: Partial<TransactionState>): Transaction {
    return new Transaction({ ...this.state, ...changes });
  }
}
