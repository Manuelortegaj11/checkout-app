import type { TransactionOutput } from '@application/dtos/transaction/transaction.output';
import type { TransactionView } from '@application/dtos/transaction/transaction-view';

export const toTransactionOutput = ({
  transaction,
  product,
  customer,
}: TransactionView): TransactionOutput => {
  const {
    id,
    reference,
    status,
    statusMessage,
    paymentSubmittedAt,
    quantity,
    currency,
    amounts,
    delivery,
    createdAt,
    finalizedAt,
  } = transaction.toPlainObject();
  const { name, imageUrl } = product.toPlainObject();
  const { fullName, email } = customer.toPlainObject();

  return {
    id,
    reference,
    status,
    statusMessage,
    paymentSubmitted: paymentSubmittedAt !== null,
    quantity,
    product: { id: product.id, name, imageUrl },
    amounts: { currency, ...amounts },
    customer: { fullName, email },
    delivery: {
      status: delivery.status,
      recipientName: delivery.recipientName,
      addressLine1: delivery.addressLine1,
      city: delivery.city,
      region: delivery.region,
    },
    createdAt: createdAt.toISOString(),
    finalizedAt: finalizedAt?.toISOString() ?? null,
  };
};
