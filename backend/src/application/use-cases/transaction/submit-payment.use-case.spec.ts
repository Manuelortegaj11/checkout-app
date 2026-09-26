import type { SubmitPaymentInput } from '@application/dtos/transaction/submit-payment.input';
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
import { SubmitPaymentUseCase } from './submit-payment.use-case';

const input: SubmitPaymentInput = {
  transactionId: TRANSACTION_ID,
  cardToken: 'tok_stagtest_5113_abc',
  installments: 1,
  acceptanceToken: 'end-user-policy-token',
  personalDataAuthToken: 'personal-data-auth-token',
};

const aView = (transaction: Transaction = aTransaction()): TransactionView => ({
  transaction,
  product: aProduct({ stock: 12 }),
  customer: aCustomer(),
});

const gatewayRejected = appError(
  'EXTERNAL_SERVICE',
  'PAYMENT_GATEWAY_REJECTED',
  'Payment gateway rejected the request',
);
const dbError = appError(
  'INFRASTRUCTURE',
  'DB_QUERY_FAILED',
  'Database query failed',
);

describe('SubmitPaymentUseCase', () => {
  const transactions = mockTransactionRepository();
  const paymentGateway = mockPaymentGateway();
  const useCase = new SubmitPaymentUseCase(
    transactions,
    paymentGateway,
    mockClock(FINALIZED_AT),
  );

  /** Transacción con la que se llamó a `savePaymentResult`. */
  const saved = (): Transaction =>
    transactions.savePaymentResult.mock.calls[0][0];

  beforeEach(() => {
    transactions.findViewById.mockReturnValue(okAsync(aView()));
    transactions.claimPaymentSubmission.mockReturnValue(okAsync(true));
    transactions.savePaymentResult.mockReturnValue(okAsync(undefined));
    paymentGateway.charge.mockReturnValue(okAsync(aPaymentResult()));
  });

  describe('camino feliz', () => {
    it('cobra la transacción y la liquida como APPROVED con la entrega asignada', async () => {
      const result = await useCase.execute(input);

      expect(result._unsafeUnwrap()).toMatchObject({
        id: TRANSACTION_ID,
        status: 'APPROVED',
        statusMessage: null,
        paymentSubmitted: true,
        delivery: { status: 'ASSIGNED' },
        finalizedAt: FINALIZED_AT.toISOString(),
      });
      expect(saved().toPlainObject()).toMatchObject({
        status: 'APPROVED',
        gatewayTransactionId: GATEWAY_TRANSACTION_ID,
      });
    });

    it('envía a la pasarela el total, la referencia, el cliente y los tokens', async () => {
      await useCase.execute(input);

      expect(paymentGateway.charge).toHaveBeenCalledWith({
        reference: 'TX-019200000000700080000000000000A1',
        amountInCents: 20_040_000,
        currency: 'COP',
        customerEmail: 'ana@example.com',
        cardToken: 'tok_stagtest_5113_abc',
        installments: 1,
        acceptanceToken: 'end-user-policy-token',
        personalDataAuthToken: 'personal-data-auth-token',
      });
    });

    it('reserva el envío antes de cobrar', async () => {
      await useCase.execute(input);

      const [claimed] = transactions.claimPaymentSubmission.mock.calls[0];
      expect(claimed.toPlainObject().paymentSubmittedAt).toEqual(FINALIZED_AT);
    });

    it('un pago rechazado viaja por el riel de éxito, con su motivo', async () => {
      paymentGateway.charge.mockReturnValue(
        okAsync(
          aPaymentResult({
            status: 'DECLINED',
            statusMessage: 'La transacción fue rechazada (Sandbox)',
          }),
        ),
      );

      const result = await useCase.execute(input);

      expect(result._unsafeUnwrap()).toMatchObject({
        status: 'DECLINED',
        statusMessage: 'La transacción fue rechazada (Sandbox)',
        delivery: { status: 'CANCELLED' },
      });
    });

    it('si el resultado aún no es final, registra el cobro y responde PENDING', async () => {
      paymentGateway.charge.mockReturnValue(
        okAsync(aPaymentResult({ status: 'PENDING' })),
      );

      const result = await useCase.execute(input);

      expect(result._unsafeUnwrap()).toMatchObject({
        status: 'PENDING',
        paymentSubmitted: true,
        finalizedAt: null,
      });
      expect(saved().pendingPaymentId()).toBe(GATEWAY_TRANSACTION_ID);
    });
  });

  describe('riel de error: no se cobra', () => {
    it('falla con TRANSACTION_NOT_FOUND si no existe', async () => {
      transactions.findViewById.mockReturnValue(okAsync(null));

      const result = await useCase.execute(input);

      expect(result._unsafeUnwrapErr().code).toBe('TRANSACTION_NOT_FOUND');
      expect(paymentGateway.charge).not.toHaveBeenCalled();
    });

    it('falla con TRANSACTION_ALREADY_RESOLVED si ya tiene resultado', async () => {
      const approved = anAwaitingTransaction()
        .applyPaymentResult(aPaymentResult(), FINALIZED_AT)
        ._unsafeUnwrap();
      transactions.findViewById.mockReturnValue(okAsync(aView(approved)));

      const result = await useCase.execute(input);

      expect(result._unsafeUnwrapErr().code).toBe(
        'TRANSACTION_ALREADY_RESOLVED',
      );
      expect(transactions.claimPaymentSubmission).not.toHaveBeenCalled();
      expect(paymentGateway.charge).not.toHaveBeenCalled();
    });

    it('falla con PAYMENT_ALREADY_SUBMITTED si el cobro ya se envió', async () => {
      transactions.findViewById.mockReturnValue(
        okAsync(aView(anAwaitingTransaction())),
      );

      const result = await useCase.execute(input);

      expect(result._unsafeUnwrapErr().code).toBe('PAYMENT_ALREADY_SUBMITTED');
      expect(paymentGateway.charge).not.toHaveBeenCalled();
    });

    it('falla con OUT_OF_STOCK si el stock se agotó antes de cobrar', async () => {
      transactions.findViewById.mockReturnValue(
        okAsync({ ...aView(), product: aProduct({ stock: 0 }) }),
      );

      const result = await useCase.execute(input);

      expect(result._unsafeUnwrapErr().code).toBe('OUT_OF_STOCK');
      expect(transactions.claimPaymentSubmission).not.toHaveBeenCalled();
      expect(paymentGateway.charge).not.toHaveBeenCalled();
    });

    it('falla con PAYMENT_ALREADY_SUBMITTED si otra petición se adelantó', async () => {
      transactions.claimPaymentSubmission.mockReturnValue(okAsync(false));

      const result = await useCase.execute(input);

      expect(result._unsafeUnwrapErr().code).toBe('PAYMENT_ALREADY_SUBMITTED');
      expect(paymentGateway.charge).not.toHaveBeenCalled();
    });

    it('propaga el error al reservar el envío', async () => {
      transactions.claimPaymentSubmission.mockReturnValue(errAsync(dbError));

      const result = await useCase.execute(input);

      expect(result._unsafeUnwrapErr()).toBe(dbError);
      expect(paymentGateway.charge).not.toHaveBeenCalled();
    });

    it('propaga el error al consultar la transacción', async () => {
      transactions.findViewById.mockReturnValue(errAsync(dbError));

      const result = await useCase.execute(input);

      expect(result._unsafeUnwrapErr()).toBe(dbError);
    });
  });

  describe('riel de error: la pasarela falla (compensación)', () => {
    it('deja la compra en ERROR con el motivo y devuelve el error de la pasarela', async () => {
      paymentGateway.charge.mockReturnValue(errAsync(gatewayRejected));

      const result = await useCase.execute(input);

      expect(result._unsafeUnwrapErr()).toBe(gatewayRejected);
      expect(saved().toPlainObject()).toMatchObject({
        status: 'ERROR',
        statusMessage: 'Payment gateway rejected the request',
        gatewayTransactionId: null,
        finalizedAt: FINALIZED_AT,
        delivery: { status: 'CANCELLED' },
      });
    });

    it('si tampoco se puede guardar el ERROR, prevalece el error de la pasarela', async () => {
      paymentGateway.charge.mockReturnValue(errAsync(gatewayRejected));
      transactions.savePaymentResult.mockReturnValue(errAsync(dbError));

      const result = await useCase.execute(input);

      expect(result._unsafeUnwrapErr()).toBe(gatewayRejected);
    });
  });

  it('propaga el error al guardar el resultado del cobro', async () => {
    transactions.savePaymentResult.mockReturnValue(errAsync(dbError));

    const result = await useCase.execute(input);

    expect(result._unsafeUnwrapErr()).toBe(dbError);
  });
});
