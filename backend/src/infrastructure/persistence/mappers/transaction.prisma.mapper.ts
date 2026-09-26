import type { TransactionView } from '@application/dtos/transaction/transaction-view';
import type { Currency } from '@domain/constants/currency.constants';
import { Transaction } from '@domain/entities/transaction.entity';
import type { AppError } from '@shared/errors/app-error';
import { err, ok, type Result } from '@shared/result';
import { databaseError } from '../database.errors';
import type {
  Delivery as DeliveryRow,
  Prisma,
  Transaction as TransactionRow,
} from '../generated/prisma/client';
import { toCustomerEntity } from './customer.prisma.mapper';
import { toProductEntity } from './product.prisma.mapper';

/** Relaciones que se cargan junto con la transacción, en una sola consulta. */
export const TRANSACTION_VIEW_INCLUDE = {
  delivery: true,
  product: true,
  customer: true,
} as const satisfies Prisma.TransactionInclude;

export type TransactionViewRow = Prisma.TransactionGetPayload<{
  include: typeof TRANSACTION_VIEW_INCLUDE;
}>;

/** Filas de `transactions` + `deliveries` → agregado Transaction. */
export const toTransactionEntity = (
  row: TransactionRow,
  delivery: DeliveryRow,
): Transaction =>
  Transaction.reconstitute({
    id: row.id,
    reference: row.reference,
    status: row.status,
    productId: row.productId,
    customerId: row.customerId,
    quantity: row.quantity,
    // La escribe siempre el dominio (STORE_CURRENCY); el esquema la guarda como texto.
    currency: row.currency as Currency,
    amounts: {
      unitPriceInCents: row.unitPriceInCents,
      productAmountInCents: row.productAmountInCents,
      baseFeeInCents: row.baseFeeInCents,
      deliveryFeeInCents: row.deliveryFeeInCents,
      totalInCents: row.totalInCents,
    },
    delivery: {
      status: delivery.status,
      recipientName: delivery.recipientName,
      phone: delivery.phone,
      addressLine1: delivery.addressLine1,
      addressLine2: delivery.addressLine2,
      city: delivery.city,
      region: delivery.region,
      postalCode: delivery.postalCode,
    },
    gatewayTransactionId: row.gatewayTransactionId,
    paymentSubmittedAt: row.paymentSubmittedAt,
    statusMessage: row.statusMessage,
    finalizedAt: row.finalizedAt,
    createdAt: row.createdAt,
  });

/**
 * Fila con sus relaciones → vista de la transacción. Toda transacción se crea
 * con su entrega en la misma escritura: si falta, el dato está corrupto.
 */
export const toTransactionView = (
  row: TransactionViewRow,
): Result<TransactionView, AppError> =>
  row.delivery
    ? ok({
        transaction: toTransactionEntity(row, row.delivery),
        product: toProductEntity(row.product),
        customer: toCustomerEntity(row.customer),
      })
    : err(databaseError(new Error(`Transaction ${row.id} has no delivery`)));

/**
 * Entidad → datos para crear la fila de `transactions` con su fila de
 * `deliveries` en una escritura anidada (atómica).
 */
export const toTransactionCreateData = (
  transaction: Transaction,
): Prisma.TransactionUncheckedCreateInput => {
  const { amounts, delivery, ...props } = transaction.toPlainObject();

  return {
    id: props.id,
    reference: props.reference,
    status: props.status,
    productId: props.productId,
    customerId: props.customerId,
    quantity: props.quantity,
    unitPriceInCents: amounts.unitPriceInCents,
    productAmountInCents: amounts.productAmountInCents,
    baseFeeInCents: amounts.baseFeeInCents,
    deliveryFeeInCents: amounts.deliveryFeeInCents,
    totalInCents: amounts.totalInCents,
    currency: props.currency,
    gatewayTransactionId: props.gatewayTransactionId,
    paymentSubmittedAt: props.paymentSubmittedAt,
    statusMessage: props.statusMessage,
    finalizedAt: props.finalizedAt,
    createdAt: props.createdAt,
    delivery: {
      create: {
        status: delivery.status,
        recipientName: delivery.recipientName,
        phone: delivery.phone,
        addressLine1: delivery.addressLine1,
        addressLine2: delivery.addressLine2,
        city: delivery.city,
        region: delivery.region,
        postalCode: delivery.postalCode,
      },
    },
  };
};
