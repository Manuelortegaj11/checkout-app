import {
  transactionsApi,
  type CreateTransactionRequest,
} from '@shared/api/transactions.api';
import { PRODUCT_ID } from '@testing/fixtures/product.fixture';
import {
  aTransaction,
  anApprovedTransaction,
  TRANSACTION_ID,
} from '@testing/fixtures/transaction.fixture';
import { fakeResponse, mockFetch } from '@testing/helpers/fetch.helper';

const request: CreateTransactionRequest = {
  productId: PRODUCT_ID,
  quantity: 1,
  customer: {
    fullName: 'Ana Gómez',
    email: 'ana@example.com',
    phone: '3001234567',
  },
  delivery: {
    recipientName: 'Ana Gómez',
    phone: '3001234567',
    addressLine1: 'Calle 10 # 20-30',
    city: 'Medellín',
    region: 'Antioquia',
  },
};

const payment = {
  cardToken: 'tok_test_4242',
  installments: 1,
  acceptanceToken: 'end-user-policy-token',
  personalDataAuthToken: 'personal-data-auth-token',
};

describe('transactionsApi', () => {
  let fetchMock: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    fetchMock = mockFetch();
  });

  it('create abre la compra con POST /api/transactions', async () => {
    fetchMock.mockResolvedValue(fakeResponse(201, aTransaction()));

    await expect(transactionsApi.create(request)).resolves.toEqual(
      aTransaction(),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/transactions',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(request),
      }),
    );
  });

  it('pay cobra con POST /api/transactions/:id/payment enviando solo tokens', async () => {
    fetchMock.mockResolvedValue(fakeResponse(200, anApprovedTransaction()));

    await expect(transactionsApi.pay(TRANSACTION_ID, payment)).resolves.toEqual(
      anApprovedTransaction(),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/transactions/${TRANSACTION_ID}/payment`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(payment),
      }),
    );
  });

  it('pay espera más que el tiempo límite general: la pasarela puede tardar ~10 s', async () => {
    jest.useFakeTimers();
    try {
      fetchMock.mockImplementation(
        (_input, init) =>
          new Promise((resolve, reject) => {
            init?.signal?.addEventListener('abort', () =>
              reject(new DOMException('aborted', 'AbortError')),
            );
            setTimeout(
              () => resolve(fakeResponse(200, anApprovedTransaction())),
              15_000,
            );
          }),
      );

      const paid = transactionsApi.pay(TRANSACTION_ID, payment);
      await jest.advanceTimersByTimeAsync(15_000);

      await expect(paid).resolves.toEqual(anApprovedTransaction());
    } finally {
      jest.useRealTimers();
    }
  });

  it('get consulta GET /api/transactions/:id', async () => {
    fetchMock.mockResolvedValue(fakeResponse(200, aTransaction()));

    await expect(transactionsApi.get(TRANSACTION_ID)).resolves.toEqual(
      aTransaction(),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/transactions/${TRANSACTION_ID}`,
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('codifica el id en la ruta', async () => {
    fetchMock.mockResolvedValue(fakeResponse(200, aTransaction()));

    await transactionsApi.get('a/b');

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/transactions/a%2Fb',
      expect.any(Object),
    );
  });
});
