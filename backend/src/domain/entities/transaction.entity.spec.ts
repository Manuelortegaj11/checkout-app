import { Quantity } from '@domain/value-objects/quantity.vo';
import {
  aNewTransaction,
  CREATED_AT,
  TRANSACTION_ID,
} from '@testing/fixtures/transaction.fixture';
import { Transaction } from './transaction.entity';

describe('Transaction', () => {
  describe('create', () => {
    it('abre la compra en PENDING, con su entrega a la espera del pago', () => {
      const transaction = Transaction.create(aNewTransaction());

      expect(transaction.id).toBe(TRANSACTION_ID);
      expect(transaction.toPlainObject()).toMatchObject({
        status: 'PENDING',
        productId: aNewTransaction().productId,
        customerId: aNewTransaction().customerId,
        quantity: 1,
        currency: 'COP',
        delivery: { status: 'PENDING_PAYMENT', recipientName: 'Ana Gómez' },
        gatewayTransactionId: null,
        paymentSubmittedAt: null,
        statusMessage: null,
        finalizedAt: null,
        createdAt: CREATED_AT,
      });
    });

    it('calcula los montos: precio × cantidad + tarifa base + envío', () => {
      const transaction = Transaction.create(
        aNewTransaction({ quantity: Quantity.create(2)._unsafeUnwrap() }),
      );

      expect(transaction.toPlainObject().amounts).toEqual({
        unitPriceInCents: 18_990_000,
        productAmountInCents: 37_980_000,
        baseFeeInCents: 250_000,
        deliveryFeeInCents: 800_000,
        totalInCents: 39_030_000,
      });
    });

    it('deriva una referencia única del id, sin guiones y en mayúsculas', () => {
      const transaction = Transaction.create(
        aNewTransaction({ id: '0192ab00-0000-7000-8000-0000000000a1' }),
      );

      expect(transaction.toPlainObject().reference).toBe(
        'TX-0192AB000000700080000000000000A1',
      );
    });
  });

  it('se reconstruye con los datos persistidos, incluida la entrega', () => {
    const props = {
      ...Transaction.create(aNewTransaction()).toPlainObject(),
      status: 'APPROVED' as const,
    };

    expect(Transaction.reconstitute(props).toPlainObject()).toEqual(props);
  });

  it('toPlainObject devuelve una copia que no altera la entidad', () => {
    const transaction = Transaction.create(aNewTransaction());
    const plain = transaction.toPlainObject();

    (plain.amounts as { totalInCents: number }).totalInCents = 0;
    (plain.delivery as { city: string }).city = 'Otra';

    expect(transaction.toPlainObject().amounts.totalInCents).toBe(20_040_000);
    expect(transaction.toPlainObject().delivery.city).toBe('Medellín');
  });
});
