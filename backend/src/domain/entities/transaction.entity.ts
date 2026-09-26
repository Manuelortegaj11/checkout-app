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
  /** Identifica la compra ante la pasarela de pagos. */
  readonly reference: string;
  readonly status: TransactionStatus;
  readonly productId: string;
  readonly customerId: string;
  readonly quantity: number;
  readonly currency: Currency;
  /** Precios y tarifas copiados al comprar: el histórico no cambia si cambian después. */
  readonly amounts: TransactionAmounts;
  readonly delivery: DeliveryProps;
  readonly gatewayTransactionId: string | null;
  readonly paymentSubmittedAt: Date | null;
  readonly statusMessage: string | null;
  readonly finalizedAt: Date | null;
  readonly createdAt: Date;
}

/** Datos para abrir una compra: ya validados (Quantity) y con el stock comprobado. */
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

/** Lo que respondió la pasarela sobre un cobro. */
export interface PaymentResult {
  readonly gatewayTransactionId: string;
  readonly status: TransactionStatus;
  /** Motivo de un rechazo o error, si la pasarela lo informa. */
  readonly statusMessage: string | null;
}

type TransactionState = Omit<TransactionProps, 'delivery'> & {
  readonly delivery: Delivery;
};

/** Única porque deriva del id: `TX-0192…` (sin guiones, en mayúsculas). */
const referenceFor = (transactionId: string): string =>
  `TX-${transactionId.replace(/-/g, '').toUpperCase()}`;

/**
 * Compra de un producto (aggregate root). Contiene su entrega y referencia
 * al producto y al cliente por su id, como corresponde entre agregados.
 */
export class Transaction {
  private constructor(private readonly state: TransactionState) {}

  /**
   * Abre la compra en PENDING con su entrega a la espera del pago. Los montos
   * se calculan aquí, nunca llegan desde fuera. No puede fallar: la cantidad
   * ya es un Quantity válido.
   */
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

  /** Reconstruye una transacción ya persistida, con su entrega. */
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

  /**
   * Id en la pasarela del cobro cuyo resultado todavía no se conoce, o `null`
   * si no hay ninguno: aún no se envió o la compra ya tiene resultado.
   */
  pendingPaymentId(): string | null {
    return this.state.status === TRANSACTION_STATUS.PENDING
      ? this.state.gatewayTransactionId
      : null;
  }

  /**
   * Marca el inicio del cobro. Solo una vez y solo mientras siga PENDING:
   * reenviar un cobro a la pasarela podría cobrar dos veces.
   */
  startPayment(submittedAt: Date): Result<Transaction, AppError> {
    return this.ensurePending().andThen(() =>
      this.state.paymentSubmittedAt === null
        ? ok(this.with({ paymentSubmittedAt: submittedAt }))
        : err(paymentAlreadySubmitted(this.state.id)),
    );
  }

  /**
   * Registra la respuesta de la pasarela. Si el estado ya es final, liquida la
   * compra: guarda el resultado y asigna o cancela la entrega.
   */
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

  /** La pasarela no aceptó o no recibió el cobro: la compra termina en ERROR. */
  failPayment(reason: string, at: Date): Result<Transaction, AppError> {
    return this.ensurePending().map(() =>
      this.settle(TRANSACTION_STATUS.ERROR, reason, at),
    );
  }

  /** Copia de los datos: modificarla no altera la entidad. */
  toPlainObject(): TransactionProps {
    return {
      ...this.state,
      amounts: { ...this.state.amounts },
      delivery: this.state.delivery.toPlainObject(),
    };
  }

  /** Una transacción solo sale de PENDING una vez. */
  private ensurePending(): Result<void, AppError> {
    return this.state.status === TRANSACTION_STATUS.PENDING
      ? ok(undefined)
      : err(transactionAlreadyResolved(this.state.id));
  }

  /** Estado final: guarda el resultado y liquida la entrega. */
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
