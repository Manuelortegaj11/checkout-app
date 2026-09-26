import type { Currency } from '@domain/constants/currency.constants';
import type { DeliveryStatus } from '@domain/constants/delivery.constants';
import type { TransactionStatus } from '@domain/constants/transaction.constants';
import type { TransactionAmounts } from '@domain/rules/pricing.rules';

export interface TransactionProductOutput {
  readonly id: string;
  readonly name: string;
  readonly imageUrl: string;
}

export interface TransactionAmountsOutput extends TransactionAmounts {
  readonly currency: Currency;
}

export interface TransactionCustomerOutput {
  readonly fullName: string;
  readonly email: string;
}

export interface TransactionDeliveryOutput {
  readonly status: DeliveryStatus;
  readonly recipientName: string;
  readonly addressLine1: string;
  readonly city: string;
  readonly region: string;
}

/** Resumen de una transacción para el checkout. No expone datos internos de la pasarela. */
export interface TransactionOutput {
  readonly id: string;
  readonly reference: string;
  readonly status: TransactionStatus;
  readonly statusMessage: string | null;
  readonly paymentSubmitted: boolean;
  readonly quantity: number;
  readonly product: TransactionProductOutput;
  readonly amounts: TransactionAmountsOutput;
  readonly customer: TransactionCustomerOutput;
  readonly delivery: TransactionDeliveryOutput;
  /** ISO 8601 UTC. */
  readonly createdAt: string;
  /** ISO 8601 UTC; `null` mientras siga PENDING. */
  readonly finalizedAt: string | null;
}
