import {
  invalidQuantity,
  paymentAlreadySubmitted,
  transactionAlreadyResolved,
  transactionNotFound,
} from './transaction.errors';

describe('transaction errors', () => {
  it.each([
    [invalidQuantity(0), 'VALIDATION', 'INVALID_QUANTITY'],
    [transactionNotFound('tx-1'), 'NOT_FOUND', 'TRANSACTION_NOT_FOUND'],
    [
      transactionAlreadyResolved('tx-1'),
      'CONFLICT',
      'TRANSACTION_ALREADY_RESOLVED',
    ],
    [paymentAlreadySubmitted('tx-1'), 'CONFLICT', 'PAYMENT_ALREADY_SUBMITTED'],
  ])('%o tiene tipo %s y código %s', (error, type, code) => {
    expect(error).toMatchObject({ type, code });
  });

  it('los mensajes identifican la transacción', () => {
    expect(transactionNotFound('tx-1').message).toBe(
      'Transaction tx-1 not found',
    );
    expect(transactionAlreadyResolved('tx-1').message).toBe(
      'Transaction tx-1 is already resolved',
    );
    expect(paymentAlreadySubmitted('tx-1').message).toBe(
      'Payment for transaction tx-1 was already submitted',
    );
  });
});
