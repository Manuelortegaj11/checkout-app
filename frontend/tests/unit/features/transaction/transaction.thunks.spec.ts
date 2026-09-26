import {
  createTransaction,
  fetchTransaction,
  payTransaction,
} from '@features/transaction/transaction.thunks';
import { ApiError } from '@shared/api/api-error';
import {
  transactionsApi,
  type CreateTransactionRequest,
} from '@shared/api/transactions.api';
import { makeStore } from '@store/index';
import {
  aTransaction,
  anApprovedTransaction,
  aDeclinedTransaction,
  TRANSACTION_ID,
} from '@testing/fixtures/transaction.fixture';

const request = { productId: 'p', quantity: 1 } as CreateTransactionRequest;
const payment = {
  cardToken: 'tok_test_4242',
  installments: 1,
  acceptanceToken: 'end-user-policy-token',
  personalDataAuthToken: 'personal-data-auth-token',
};

describe('thunks de la transacción', () => {
  it('createTransaction abre la compra y la guarda', async () => {
    const create = jest
      .spyOn(transactionsApi, 'create')
      .mockResolvedValue(aTransaction());
    const store = makeStore();

    await store.dispatch(createTransaction(request));

    expect(create).toHaveBeenCalledWith(request);
    expect(store.getState().transaction.current).toEqual(aTransaction());
  });

  it('payTransaction cobra con los tokens y guarda el resultado', async () => {
    const pay = jest
      .spyOn(transactionsApi, 'pay')
      .mockResolvedValue(anApprovedTransaction());
    const store = makeStore();

    await store.dispatch(payTransaction({ id: TRANSACTION_ID, payment }));

    expect(pay).toHaveBeenCalledWith(TRANSACTION_ID, payment);
    expect(store.getState().transaction.current?.status).toBe('APPROVED');
  });

  it('un pago rechazado se resuelve con DECLINED: no es un error', async () => {
    jest
      .spyOn(transactionsApi, 'pay')
      .mockResolvedValue(aDeclinedTransaction());
    const store = makeStore();

    const action = await store.dispatch(
      payTransaction({ id: TRANSACTION_ID, payment }),
    );

    expect(payTransaction.fulfilled.match(action)).toBe(true);
    expect(store.getState().transaction.errorCode).toBeNull();
  });

  it('fetchTransaction consulta la transacción por su id', async () => {
    const get = jest
      .spyOn(transactionsApi, 'get')
      .mockResolvedValue(anApprovedTransaction());
    const store = makeStore();

    await store.dispatch(fetchTransaction(TRANSACTION_ID));

    expect(get).toHaveBeenCalledWith(TRANSACTION_ID);
    expect(store.getState().transaction.current).toEqual(
      anApprovedTransaction(),
    );
  });

  describe('rechazan con el code del ApiError', () => {
    const failWith = (code: string) => new ApiError(code, 409, 'failed');

    it('createTransaction', async () => {
      jest
        .spyOn(transactionsApi, 'create')
        .mockRejectedValue(failWith('OUT_OF_STOCK'));
      const store = makeStore();

      const action = await store.dispatch(createTransaction(request));

      expect(action.payload).toBe('OUT_OF_STOCK');
      expect(store.getState().transaction.errorCode).toBe('OUT_OF_STOCK');
    });

    it('payTransaction', async () => {
      jest
        .spyOn(transactionsApi, 'pay')
        .mockRejectedValue(failWith('PAYMENT_GATEWAY_UNAVAILABLE'));
      const store = makeStore();

      const action = await store.dispatch(
        payTransaction({ id: TRANSACTION_ID, payment }),
      );

      expect(action.payload).toBe('PAYMENT_GATEWAY_UNAVAILABLE');
    });

    it('fetchTransaction', async () => {
      jest
        .spyOn(transactionsApi, 'get')
        .mockRejectedValue(failWith('TRANSACTION_NOT_FOUND'));
      const store = makeStore();

      const action = await store.dispatch(fetchTransaction(TRANSACTION_ID));

      expect(action.payload).toBe('TRANSACTION_NOT_FOUND');
    });
  });
});
