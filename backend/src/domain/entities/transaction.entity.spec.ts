import { Quantity } from '@domain/value-objects/quantity.vo';
import {
  aNewTransaction,
  anAwaitingTransaction,
  aPaymentResult,
  aTransaction,
  CREATED_AT,
  FINALIZED_AT,
  GATEWAY_TRANSACTION_ID,
  PAYMENT_SUBMITTED_AT,
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

  describe('startPayment', () => {
    it('marca el inicio del cobro sin cambiar el estado', () => {
      const started = aTransaction()
        .startPayment(PAYMENT_SUBMITTED_AT)
        ._unsafeUnwrap();

      expect(started.toPlainObject()).toMatchObject({
        status: 'PENDING',
        paymentSubmittedAt: PAYMENT_SUBMITTED_AT,
        gatewayTransactionId: null,
      });
    });

    it('no modifica la transacción original', () => {
      const transaction = aTransaction();

      transaction.startPayment(PAYMENT_SUBMITTED_AT);

      expect(transaction.toPlainObject().paymentSubmittedAt).toBeNull();
    });

    it('falla con PAYMENT_ALREADY_SUBMITTED si el cobro ya se envió', () => {
      const result = anAwaitingTransaction().startPayment(PAYMENT_SUBMITTED_AT);

      expect(result._unsafeUnwrapErr().code).toBe('PAYMENT_ALREADY_SUBMITTED');
    });

    it('falla con TRANSACTION_ALREADY_RESOLVED si ya tiene resultado', () => {
      const approved = anAwaitingTransaction()
        .applyPaymentResult(aPaymentResult(), FINALIZED_AT)
        ._unsafeUnwrap();

      const result = approved.startPayment(PAYMENT_SUBMITTED_AT);

      expect(result._unsafeUnwrapErr().code).toBe(
        'TRANSACTION_ALREADY_RESOLVED',
      );
    });
  });

  describe('applyPaymentResult', () => {
    const started = () =>
      aTransaction().startPayment(PAYMENT_SUBMITTED_AT)._unsafeUnwrap();

    it('con un resultado PENDING registra el cobro y sigue esperando', () => {
      const awaiting = started()
        .applyPaymentResult(aPaymentResult({ status: 'PENDING' }), FINALIZED_AT)
        ._unsafeUnwrap();

      expect(awaiting.pendingPaymentId()).toBe(GATEWAY_TRANSACTION_ID);
      expect(awaiting.gatewayTransactionId).toBe(GATEWAY_TRANSACTION_ID);
      expect(awaiting.toPlainObject()).toMatchObject({
        status: 'PENDING',
        gatewayTransactionId: GATEWAY_TRANSACTION_ID,
        finalizedAt: null,
        delivery: { status: 'PENDING_PAYMENT' },
      });
    });

    it('con APPROVED liquida la compra y asigna la entrega', () => {
      const approved = started()
        .applyPaymentResult(aPaymentResult(), FINALIZED_AT)
        ._unsafeUnwrap();

      expect(approved.status).toBe('APPROVED');
      expect(approved.pendingPaymentId()).toBeNull();
      expect(approved.gatewayTransactionId).toBe(GATEWAY_TRANSACTION_ID);
      expect(approved.toPlainObject()).toMatchObject({
        gatewayTransactionId: GATEWAY_TRANSACTION_ID,
        statusMessage: null,
        finalizedAt: FINALIZED_AT,
        delivery: { status: 'ASSIGNED' },
      });
    });

    it.each(['DECLINED', 'VOIDED', 'ERROR'] as const)(
      'con %s liquida la compra, guarda el motivo y cancela la entrega',
      (status) => {
        const settled = started()
          .applyPaymentResult(
            aPaymentResult({
              status,
              statusMessage: 'La transacción fue rechazada (Sandbox)',
            }),
            FINALIZED_AT,
          )
          ._unsafeUnwrap();

        expect(settled.toPlainObject()).toMatchObject({
          status,
          statusMessage: 'La transacción fue rechazada (Sandbox)',
          finalizedAt: FINALIZED_AT,
          delivery: { status: 'CANCELLED' },
        });
      },
    );

    it('falla con TRANSACTION_ALREADY_RESOLVED si ya tiene resultado', () => {
      const approved = started()
        .applyPaymentResult(aPaymentResult(), FINALIZED_AT)
        ._unsafeUnwrap();

      const result = approved.applyPaymentResult(
        aPaymentResult({ status: 'DECLINED' }),
        FINALIZED_AT,
      );

      expect(result._unsafeUnwrapErr().code).toBe(
        'TRANSACTION_ALREADY_RESOLVED',
      );
    });
  });

  describe('failPayment', () => {
    it('termina la compra en ERROR con el motivo y cancela la entrega', () => {
      const failed = aTransaction()
        .startPayment(PAYMENT_SUBMITTED_AT)
        .andThen((transaction) =>
          transaction.failPayment(
            'Payment gateway is unavailable',
            FINALIZED_AT,
          ),
        )
        ._unsafeUnwrap();

      expect(failed.toPlainObject()).toMatchObject({
        status: 'ERROR',
        statusMessage: 'Payment gateway is unavailable',
        gatewayTransactionId: null,
        finalizedAt: FINALIZED_AT,
        delivery: { status: 'CANCELLED' },
      });
    });

    it('falla con TRANSACTION_ALREADY_RESOLVED si ya tiene resultado', () => {
      const approved = anAwaitingTransaction()
        .applyPaymentResult(aPaymentResult(), FINALIZED_AT)
        ._unsafeUnwrap();

      const result = approved.failPayment('timeout', FINALIZED_AT);

      expect(result._unsafeUnwrapErr().code).toBe(
        'TRANSACTION_ALREADY_RESOLVED',
      );
    });
  });

  it('una transacción recién creada no tiene cobro pendiente', () => {
    expect(aTransaction().pendingPaymentId()).toBeNull();
  });
});
