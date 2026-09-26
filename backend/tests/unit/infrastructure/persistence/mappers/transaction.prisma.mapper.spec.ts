import { CUSTOMER_ID } from '@testing/fixtures/customer.fixture';
import { PRODUCT_ID } from '@testing/fixtures/product.fixture';
import {
  aTransaction,
  CREATED_AT,
  TRANSACTION_ID,
} from '@testing/fixtures/transaction.fixture';
import { aCustomerProps } from '@testing/fixtures/customer.fixture';
import { aProductProps } from '@testing/fixtures/product.fixture';
import { aTransactionViewRow } from '@testing/fixtures/transaction-row.fixture';
import {
  anAwaitingTransaction,
  aPaymentResult,
  FINALIZED_AT,
} from '@testing/fixtures/transaction.fixture';
import {
  toTransactionCreateData,
  toTransactionView,
} from '@infrastructure/persistence/mappers/transaction.prisma.mapper';

describe('toTransactionCreateData', () => {
  it('aplana los montos y anida la entrega para crearlas juntas', () => {
    expect(toTransactionCreateData(aTransaction())).toEqual({
      id: TRANSACTION_ID,
      reference: 'TX-019200000000700080000000000000A1',
      status: 'PENDING',
      productId: PRODUCT_ID,
      customerId: CUSTOMER_ID,
      quantity: 1,
      unitPriceInCents: 18_990_000,
      productAmountInCents: 18_990_000,
      baseFeeInCents: 250_000,
      deliveryFeeInCents: 800_000,
      totalInCents: 20_040_000,
      currency: 'COP',
      gatewayTransactionId: null,
      paymentSubmittedAt: null,
      statusMessage: null,
      finalizedAt: null,
      createdAt: CREATED_AT,
      delivery: {
        create: {
          status: 'PENDING_PAYMENT',
          recipientName: 'Ana Gómez',
          phone: '3001234567',
          addressLine1: 'Calle 10 # 20-30',
          addressLine2: 'Apto 402',
          city: 'Medellín',
          region: 'Antioquia',
          postalCode: '050021',
        },
      },
    });
  });
});

describe('toTransactionView', () => {
  it('reconstruye la transacción, su producto y su cliente', () => {
    const transaction = aTransaction();

    const view = toTransactionView(
      aTransactionViewRow(transaction),
    )._unsafeUnwrap();

    expect(view.transaction.toPlainObject()).toEqual(
      transaction.toPlainObject(),
    );
    expect(view.product.toPlainObject()).toEqual(aProductProps());
    expect(view.customer.toPlainObject()).toEqual(aCustomerProps());
  });

  it('conserva el resultado del pago y el estado de la entrega', () => {
    const approved = anAwaitingTransaction()
      .applyPaymentResult(aPaymentResult(), FINALIZED_AT)
      ._unsafeUnwrap();

    const view = toTransactionView(
      aTransactionViewRow(approved),
    )._unsafeUnwrap();

    expect(view.transaction.toPlainObject()).toEqual(approved.toPlainObject());
  });

  it('falla con DB_QUERY_FAILED si la transacción no tiene entrega', () => {
    const row = { ...aTransactionViewRow(), delivery: null };

    const result = toTransactionView(row);

    expect(result._unsafeUnwrapErr()).toMatchObject({
      code: 'DB_QUERY_FAILED',
      cause: new Error(`Transaction ${row.id} has no delivery`),
    });
  });
});
