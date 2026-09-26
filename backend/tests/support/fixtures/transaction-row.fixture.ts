import type { Transaction } from '@domain/entities/transaction.entity';
import type { TransactionViewRow } from '@infrastructure/persistence/mappers/transaction.prisma.mapper';
import { aCustomerRow } from './customer-row.fixture';
import { aProductRow } from './product-row.fixture';
import { aTransaction } from './transaction.fixture';

/**
 * Fila de `transactions` con su entrega, su producto y su cliente, tal como la
 * devuelve Prisma con `include`. Refleja el estado de la transacción recibida.
 */
export const aTransactionViewRow = (
  transaction: Transaction = aTransaction(),
): TransactionViewRow => {
  const { amounts, delivery, ...props } = transaction.toPlainObject();

  return {
    ...props,
    ...amounts,
    updatedAt: props.createdAt,
    delivery: {
      ...delivery,
      id: '01920000-0000-7000-8000-0000000000d1',
      transactionId: props.id,
      createdAt: props.createdAt,
      updatedAt: props.createdAt,
    },
    product: aProductRow(),
    customer: aCustomerRow(),
  };
};
