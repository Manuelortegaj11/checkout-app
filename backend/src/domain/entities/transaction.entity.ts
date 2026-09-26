import {
  STORE_CURRENCY,
  type Currency,
} from '@domain/constants/currency.constants';
import {
  TRANSACTION_STATUS,
  type TransactionStatus,
} from '@domain/constants/transaction.constants';
import {
  calculateTransactionAmounts,
  type CheckoutFees,
  type TransactionAmounts,
} from '@domain/rules/pricing.rules';
import type { Quantity } from '@domain/value-objects/quantity.vo';
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

  /** Copia de los datos: modificarla no altera la entidad. */
  toPlainObject(): TransactionProps {
    return {
      ...this.state,
      amounts: { ...this.state.amounts },
      delivery: this.state.delivery.toPlainObject(),
    };
  }
}
