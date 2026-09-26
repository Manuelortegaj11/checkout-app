import type { Transaction } from '@domain/entities/transaction.entity';
import type { Prisma } from '../generated/prisma/client';

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
