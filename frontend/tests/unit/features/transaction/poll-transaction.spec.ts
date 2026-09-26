import {
  PAYMENT_STILL_PENDING,
  POLL_INTERVAL_MS,
  POLL_MAX_ATTEMPTS,
  pollTransaction,
} from '@features/transaction/transaction.thunks';
import { ApiError } from '@shared/api/api-error';
import { transactionsApi } from '@shared/api/transactions.api';
import { makeStore } from '@store/index';
import {
  aTransaction,
  anApprovedTransaction,
  TRANSACTION_ID,
} from '@testing/fixtures/transaction.fixture';

const submitted = () => aTransaction({ paymentSubmitted: true });

describe('pollTransaction', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('consulta cada 2 s hasta que el pago tiene un estado final', async () => {
    const get = jest
      .spyOn(transactionsApi, 'get')
      .mockResolvedValueOnce(submitted())
      .mockResolvedValueOnce(submitted())
      .mockResolvedValueOnce(anApprovedTransaction());
    const store = makeStore();

    const polling = store.dispatch(pollTransaction(TRANSACTION_ID));
    await jest.advanceTimersByTimeAsync(2 * POLL_INTERVAL_MS);
    const action = await polling;

    expect(get).toHaveBeenCalledTimes(3);
    expect(get).toHaveBeenCalledWith(TRANSACTION_ID);
    expect(action.payload).toEqual(anApprovedTransaction());
    expect(store.getState().transaction.current?.status).toBe('APPROVED');
  });

  it('si el cobro nunca se envió, termina en la primera consulta', async () => {
    const get = jest
      .spyOn(transactionsApi, 'get')
      .mockResolvedValue(aTransaction());
    const store = makeStore();

    const action = await store.dispatch(pollTransaction(TRANSACTION_ID));

    expect(get).toHaveBeenCalledTimes(1);
    expect(action.payload).toEqual(aTransaction());
  });

  it('un fallo de red en una consulta no corta la espera', async () => {
    jest
      .spyOn(transactionsApi, 'get')
      .mockRejectedValueOnce(new ApiError('NETWORK_ERROR', null, 'offline'))
      .mockResolvedValueOnce(anApprovedTransaction());
    const store = makeStore();

    const polling = store.dispatch(pollTransaction(TRANSACTION_ID));
    await jest.advanceTimersByTimeAsync(POLL_INTERVAL_MS);

    expect((await polling).payload).toEqual(anApprovedTransaction());
  });

  it('si sigue pendiente después de 1 minuto, rechaza con PAYMENT_STILL_PENDING', async () => {
    const get = jest
      .spyOn(transactionsApi, 'get')
      .mockResolvedValue(submitted());
    const store = makeStore();

    const polling = store.dispatch(pollTransaction(TRANSACTION_ID));
    await jest.advanceTimersByTimeAsync(
      (POLL_MAX_ATTEMPTS - 1) * POLL_INTERVAL_MS,
    );
    const action = await polling;

    expect(get).toHaveBeenCalledTimes(POLL_MAX_ATTEMPTS);
    expect(action.payload).toBe(PAYMENT_STILL_PENDING);
  });

  it('al abortar deja de consultar', async () => {
    const get = jest
      .spyOn(transactionsApi, 'get')
      .mockResolvedValue(submitted());
    const store = makeStore();

    const polling = store.dispatch(pollTransaction(TRANSACTION_ID));
    await jest.advanceTimersByTimeAsync(0);
    polling.abort();
    const action = await polling;
    await jest.advanceTimersByTimeAsync(10 * POLL_INTERVAL_MS);

    expect(pollTransaction.rejected.match(action)).toBe(true);
    expect(action.meta).toMatchObject({ aborted: true });
    expect(get).toHaveBeenCalledTimes(1);
  });
});
