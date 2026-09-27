import {
  selectCurrentTransaction,
  selectTransactionErrorCode,
  selectTransactionRequestStatus,
} from '@features/transaction/transaction.selectors';
import { makeStore } from '@store/index';
import { anApprovedTransaction } from '@testing/fixtures/transaction.fixture';

describe('selectores de la transacción', () => {
  const state = makeStore({
    transaction: {
      current: anApprovedTransaction(),
      status: 'failed',
      errorCode: 'TIMEOUT',
    },
  }).getState();

  it('leen la transacción, el estado de la petición y el error', () => {
    expect(selectCurrentTransaction(state)).toEqual(anApprovedTransaction());
    expect(selectTransactionRequestStatus(state)).toBe('failed');
    expect(selectTransactionErrorCode(state)).toBe('TIMEOUT');
  });
});
