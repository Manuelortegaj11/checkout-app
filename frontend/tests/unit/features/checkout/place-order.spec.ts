import type { CheckoutState } from '@features/checkout/checkout.slice';
import { placeOrder } from '@features/checkout/checkout.thunks';
import { ApiError } from '@shared/api/api-error';
import { transactionsApi } from '@shared/api/transactions.api';
import { makeStore } from '@store/index';
import {
  aCheckoutConfig,
  aCheckoutState,
  aTokenizedCard,
} from '@testing/fixtures/checkout.fixture';
import { PRODUCT_ID } from '@testing/fixtures/product.fixture';
import {
  aDeclinedTransaction,
  aTransaction,
  anApprovedTransaction,
  TRANSACTION_ID,
} from '@testing/fixtures/transaction.fixture';

const storeInSummary = (checkout: Partial<CheckoutState> = {}) =>
  makeStore({
    checkout: aCheckoutState({
      step: 'SUMMARY',
      productId: PRODUCT_ID,
      contact: {
        fullName: 'Ana Gómez',
        email: 'ana@example.com',
        phone: '3001234567',
      },
      address: {
        addressLine1: 'Calle 10 # 20-30',
        addressLine2: '',
        city: 'Medellín',
        region: 'Antioquia',
        postalCode: '',
      },
      card: aTokenizedCard(),
      config: { status: 'succeeded', data: aCheckoutConfig(), errorCode: null },
      ...checkout,
    }),
  });

const payment = {
  cardToken: 'tok_test_4242',
  installments: 1,
  acceptanceToken: 'end-user-policy-token',
  personalDataAuthToken: 'personal-data-auth-token',
};

describe('placeOrder', () => {
  it('abre la transacción en PENDING, guarda su id y la cobra con los tokens', async () => {
    const create = jest
      .spyOn(transactionsApi, 'create')
      .mockResolvedValue(aTransaction());
    const pay = jest
      .spyOn(transactionsApi, 'pay')
      .mockResolvedValue(anApprovedTransaction());
    const store = storeInSummary();

    const action = await store.dispatch(placeOrder());

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ productId: PRODUCT_ID, quantity: 1 }),
    );
    expect(pay).toHaveBeenCalledWith(TRANSACTION_ID, payment);
    expect(action.payload).toEqual(anApprovedTransaction());
    expect(store.getState().checkout).toMatchObject({
      step: 'RESULT',
      transactionId: TRANSACTION_ID,
      order: { status: 'idle' },
    });
  });

  it('un pago rechazado también es un resultado: pasa a RESULT', async () => {
    jest.spyOn(transactionsApi, 'create').mockResolvedValue(aTransaction());
    jest
      .spyOn(transactionsApi, 'pay')
      .mockResolvedValue(aDeclinedTransaction());
    const store = storeInSummary();

    await store.dispatch(placeOrder());

    expect(store.getState().checkout.step).toBe('RESULT');
    expect(store.getState().transaction.current?.status).toBe('DECLINED');
  });

  it('si la pasarela aún no decide, se queda en PROCESSING para consultar', async () => {
    jest.spyOn(transactionsApi, 'create').mockResolvedValue(aTransaction());
    jest
      .spyOn(transactionsApi, 'pay')
      .mockResolvedValue(aTransaction({ paymentSubmitted: true }));
    const store = storeInSummary();

    await store.dispatch(placeOrder());

    expect(store.getState().checkout).toMatchObject({
      step: 'PROCESSING',
      order: { status: 'idle' },
    });
  });

  it('mientras paga está en PROCESSING y no admite un segundo pago', async () => {
    jest
      .spyOn(transactionsApi, 'create')
      .mockReturnValue(new Promise(() => undefined));
    const store = storeInSummary();

    void store.dispatch(placeOrder());
    const second = await store.dispatch(placeOrder());

    expect(store.getState().checkout).toMatchObject({
      step: 'PROCESSING',
      order: { status: 'placing' },
    });
    expect(second.meta).toMatchObject({ condition: true });
    expect(transactionsApi.create).toHaveBeenCalledTimes(1);
  });

  it('reutiliza la transacción de un intento anterior en lugar de abrir otra', async () => {
    const create = jest.spyOn(transactionsApi, 'create');
    jest
      .spyOn(transactionsApi, 'pay')
      .mockResolvedValue(anApprovedTransaction());
    const store = storeInSummary({ transactionId: TRANSACTION_ID });

    await store.dispatch(placeOrder());

    expect(create).not.toHaveBeenCalled();
    expect(transactionsApi.pay).toHaveBeenCalledWith(TRANSACTION_ID, payment);
  });

  it('si no se pudo abrir la compra, vuelve al resumen con el motivo', async () => {
    jest
      .spyOn(transactionsApi, 'create')
      .mockRejectedValue(new ApiError('OUT_OF_STOCK', 409, 'no units'));
    const pay = jest.spyOn(transactionsApi, 'pay');
    const store = storeInSummary();

    const action = await store.dispatch(placeOrder());

    expect(action.payload).toBe('OUT_OF_STOCK');
    expect(pay).not.toHaveBeenCalled();
    expect(store.getState().checkout).toMatchObject({
      step: 'SUMMARY',
      transactionId: null,
      order: { status: 'failed', errorCode: 'OUT_OF_STOCK' },
    });
  });

  it('si el cobro falla y el backend confirma que se envió, sigue con ese resultado', async () => {
    jest.spyOn(transactionsApi, 'create').mockResolvedValue(aTransaction());
    jest
      .spyOn(transactionsApi, 'pay')
      .mockRejectedValue(
        new ApiError('PAYMENT_GATEWAY_REJECTED', 502, 'rejected'),
      );
    const errored = aTransaction({
      status: 'ERROR',
      paymentSubmitted: true,
    });
    jest.spyOn(transactionsApi, 'get').mockResolvedValue(errored);
    const store = storeInSummary();

    const action = await store.dispatch(placeOrder());

    expect(action.payload).toEqual(errored);
    expect(store.getState().checkout.step).toBe('RESULT');
  });

  it('si el cobro nunca llegó a enviarse, vuelve al resumen y conserva la transacción para reintentar', async () => {
    jest.spyOn(transactionsApi, 'create').mockResolvedValue(aTransaction());
    jest
      .spyOn(transactionsApi, 'pay')
      .mockRejectedValue(new ApiError('NETWORK_ERROR', null, 'offline'));
    jest.spyOn(transactionsApi, 'get').mockResolvedValue(aTransaction());
    const store = storeInSummary();

    const action = await store.dispatch(placeOrder());

    expect(action.payload).toBe('NETWORK_ERROR');
    expect(store.getState().checkout).toMatchObject({
      step: 'SUMMARY',
      transactionId: TRANSACTION_ID,
      order: { status: 'failed', errorCode: 'NETWORK_ERROR' },
    });
  });

  it('tras un intento fallido pide una configuración nueva: los tokens de aceptación son de un solo uso', async () => {
    jest.spyOn(transactionsApi, 'create').mockResolvedValue(aTransaction());
    jest
      .spyOn(transactionsApi, 'pay')
      .mockRejectedValue(new ApiError('TIMEOUT', null, 'slow'));
    jest
      .spyOn(transactionsApi, 'get')
      .mockRejectedValue(new ApiError('TIMEOUT', null, 'slow'));
    const store = storeInSummary();

    await store.dispatch(placeOrder());

    expect(store.getState().checkout.config).toEqual({
      status: 'idle',
      data: null,
      errorCode: null,
    });
  });

  it('sin tarjeta o sin configuración no intenta cobrar', async () => {
    const create = jest.spyOn(transactionsApi, 'create');
    const store = storeInSummary({ card: null });

    const action = await store.dispatch(placeOrder());

    expect(action.payload).toBe('UNEXPECTED_ERROR');
    expect(create).not.toHaveBeenCalled();
  });
});
