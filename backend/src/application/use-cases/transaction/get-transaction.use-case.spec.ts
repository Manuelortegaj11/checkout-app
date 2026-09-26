import type { TransactionView } from '@application/dtos/transaction/transaction-view';
import type { Transaction } from '@domain/entities/transaction.entity';
import { appError } from '@shared/errors/app-error';
import { errAsync, okAsync } from '@shared/result';
import { aCustomer } from '@testing/fixtures/customer.fixture';
import { aProduct } from '@testing/fixtures/product.fixture';
import {
  anAwaitingTransaction,
  aPaymentResult,
  aTransaction,
  FINALIZED_AT,
  GATEWAY_TRANSACTION_ID,
  TRANSACTION_ID,
} from '@testing/fixtures/transaction.fixture';
import { mockPaymentGateway } from '@testing/mocks/payment-gateway.mock';
import { mockClock } from '@testing/mocks/system.mock';
import { mockTransactionRepository } from '@testing/mocks/transaction.repository.mock';
import { GetTransactionUseCase } from './get-transaction.use-case';

const aView = (transaction: Transaction): TransactionView => ({
  transaction,
  product: aProduct(),
  customer: aCustomer(),
});

const dbError = appError(
  'INFRASTRUCTURE',
  'DB_QUERY_FAILED',
  'Database query failed',
);

describe('GetTransactionUseCase', () => {
  const transactions = mockTransactionRepository();
  const paymentGateway = mockPaymentGateway();
  const useCase = new GetTransactionUseCase(
    transactions,
    paymentGateway,
    mockClock(FINALIZED_AT),
  );
  const input = { transactionId: TRANSACTION_ID };

  beforeEach(() => {
    transactions.savePaymentResult.mockReturnValue(okAsync(undefined));
  });

  it('devuelve una transacción sin cobro enviado sin consultar la pasarela', async () => {
    transactions.findViewById.mockReturnValue(okAsync(aView(aTransaction())));

    const result = await useCase.execute(input);

    expect(result._unsafeUnwrap()).toMatchObject({
      id: TRANSACTION_ID,
      status: 'PENDING',
      paymentSubmitted: false,
    });
    expect(paymentGateway.getPayment).not.toHaveBeenCalled();
  });

  it('devuelve una transacción ya liquidada sin consultar la pasarela', async () => {
    const approved = anAwaitingTransaction()
      .applyPaymentResult(aPaymentResult(), FINALIZED_AT)
      ._unsafeUnwrap();
    transactions.findViewById.mockReturnValue(okAsync(aView(approved)));

    const result = await useCase.execute(input);

    expect(result._unsafeUnwrap().status).toBe('APPROVED');
    expect(paymentGateway.getPayment).not.toHaveBeenCalled();
  });

  describe('con un cobro pendiente', () => {
    beforeEach(() => {
      transactions.findViewById.mockReturnValue(
        okAsync(aView(anAwaitingTransaction())),
      );
    });

    it('liquida la transacción si la pasarela ya tiene el resultado final', async () => {
      paymentGateway.getPayment.mockReturnValue(okAsync(aPaymentResult()));

      const result = await useCase.execute(input);

      expect(paymentGateway.getPayment).toHaveBeenCalledWith(
        GATEWAY_TRANSACTION_ID,
      );
      expect(result._unsafeUnwrap()).toMatchObject({
        status: 'APPROVED',
        delivery: { status: 'ASSIGNED' },
        finalizedAt: FINALIZED_AT.toISOString(),
      });
      const [settled] = transactions.savePaymentResult.mock.calls[0];
      expect(settled.status).toBe('APPROVED');
    });

    it('sigue en PENDING, sin escribir, si la pasarela aún no tiene resultado', async () => {
      paymentGateway.getPayment.mockReturnValue(
        okAsync(aPaymentResult({ status: 'PENDING' })),
      );

      const result = await useCase.execute(input);

      expect(result._unsafeUnwrap().status).toBe('PENDING');
      expect(transactions.savePaymentResult).not.toHaveBeenCalled();
    });

    it('si la pasarela no responde, devuelve la transacción tal como está', async () => {
      paymentGateway.getPayment.mockReturnValue(
        errAsync(
          appError(
            'EXTERNAL_SERVICE',
            'PAYMENT_GATEWAY_UNAVAILABLE',
            'Payment gateway is unavailable',
          ),
        ),
      );

      const result = await useCase.execute(input);

      expect(result._unsafeUnwrap()).toMatchObject({
        status: 'PENDING',
        paymentSubmitted: true,
      });
      expect(transactions.savePaymentResult).not.toHaveBeenCalled();
    });

    it('propaga el error si no puede guardar la liquidación', async () => {
      paymentGateway.getPayment.mockReturnValue(okAsync(aPaymentResult()));
      transactions.savePaymentResult.mockReturnValue(errAsync(dbError));

      const result = await useCase.execute(input);

      expect(result._unsafeUnwrapErr()).toBe(dbError);
    });
  });

  it('falla con TRANSACTION_NOT_FOUND si no existe', async () => {
    transactions.findViewById.mockReturnValue(okAsync(null));

    const result = await useCase.execute(input);

    expect(result._unsafeUnwrapErr()).toMatchObject({
      code: 'TRANSACTION_NOT_FOUND',
      message: `Transaction ${TRANSACTION_ID} not found`,
    });
  });

  it('propaga el error al consultar la transacción', async () => {
    transactions.findViewById.mockReturnValue(errAsync(dbError));

    const result = await useCase.execute(input);

    expect(result._unsafeUnwrapErr()).toBe(dbError);
  });
});
