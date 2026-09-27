import {
  initialTransactionState,
  transactionReducer,
} from '@features/transaction/transaction.slice';
import {
  createTransaction,
  fetchTransaction,
  payTransaction,
} from '@features/transaction/transaction.thunks';
import {
  aTransaction,
  anApprovedTransaction,
  TRANSACTION_ID,
} from '@testing/fixtures/transaction.fixture';

const payArgs = {
  id: TRANSACTION_ID,
  payment: {
    cardToken: 'tok_test_4242',
    installments: 1,
    acceptanceToken: 'end-user-policy-token',
    personalDataAuthToken: 'personal-data-auth-token',
  },
};

describe('transactionReducer', () => {
  it('empieza sin transacción', () => {
    expect(transactionReducer(undefined, { type: '@@INIT' })).toEqual(
      initialTransactionState,
    );
  });

  it.each([
    ['createTransaction', createTransaction.pending('r', {} as never)],
    ['payTransaction', payTransaction.pending('r', payArgs)],
    ['fetchTransaction', fetchTransaction.pending('r', TRANSACTION_ID)],
  ])(
    '%s pending marca la carga y limpia el error anterior',
    (_name, action) => {
      const state = transactionReducer(
        { current: aTransaction(), status: 'failed', errorCode: 'TIMEOUT' },
        action,
      );

      expect(state).toEqual({
        current: aTransaction(),
        status: 'loading',
        errorCode: null,
      });
    },
  );

  it.each([
    [
      'createTransaction',
      createTransaction.fulfilled(aTransaction(), 'r', {} as never),
      aTransaction(),
    ],
    [
      'payTransaction',
      payTransaction.fulfilled(anApprovedTransaction(), 'r', payArgs),
      anApprovedTransaction(),
    ],
    [
      'fetchTransaction',
      fetchTransaction.fulfilled(anApprovedTransaction(), 'r', TRANSACTION_ID),
      anApprovedTransaction(),
    ],
  ])(
    '%s fulfilled guarda la versión que devuelve la API',
    (_name, action, expected) => {
      const state = transactionReducer(initialTransactionState, action);

      expect(state).toEqual({
        current: expected,
        status: 'succeeded',
        errorCode: null,
      });
    },
  );

  it('rejected guarda el code del error y conserva la última versión conocida', () => {
    const state = transactionReducer(
      { current: aTransaction(), status: 'loading', errorCode: null },
      payTransaction.rejected(null, 'r', payArgs, 'PAYMENT_GATEWAY_REJECTED'),
    );

    expect(state).toEqual({
      current: aTransaction(),
      status: 'failed',
      errorCode: 'PAYMENT_GATEWAY_REJECTED',
    });
  });

  it('rejected sin code usa UNEXPECTED_ERROR', () => {
    const state = transactionReducer(
      initialTransactionState,
      fetchTransaction.rejected(new Error('bug'), 'r', TRANSACTION_ID),
    );

    expect(state.errorCode).toBe('UNEXPECTED_ERROR');
  });
});
