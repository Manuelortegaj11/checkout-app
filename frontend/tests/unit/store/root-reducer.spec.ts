import { persistStore } from 'redux-persist';
import {
  checkoutStarted,
  contactChanged,
  paymentDetailsSubmitted,
} from '@features/checkout/checkout.slice';
import {
  fetchCheckoutConfig,
  placeOrder,
} from '@features/checkout/checkout.thunks';
import { createTransaction } from '@features/transaction';
import { makeStore } from '@store/index';
import {
  aCheckoutConfig,
  aTokenizedCard,
} from '@testing/fixtures/checkout.fixture';
import { PRODUCT_ID } from '@testing/fixtures/product.fixture';
import {
  aTransaction,
  TRANSACTION_ID,
} from '@testing/fixtures/transaction.fixture';
import {
  persistedCheckout,
  rehydrated,
} from '@testing/helpers/persistence.helper';

describe('persistencia del checkout', () => {
  it('guarda el checkout en localStorage, sin la configuración', async () => {
    const store = makeStore();
    const persistor = persistStore(store);
    await rehydrated(persistor);

    store.dispatch(checkoutStarted({ productId: PRODUCT_ID }));
    store.dispatch(contactChanged({ fullName: 'Ana Gómez' }));
    store.dispatch(
      fetchCheckoutConfig.fulfilled(aCheckoutConfig(), 'request-id'),
    );
    store.dispatch(paymentDetailsSubmitted(aTokenizedCard()));
    await persistor.flush();

    expect(persistedCheckout()).toMatchObject({
      step: 'SUMMARY',
      productId: PRODUCT_ID,
      contact: { fullName: 'Ana Gómez' },
      card: aTokenizedCard(),
    });
    expect(persistedCheckout()).not.toHaveProperty('config');
  });

  it('no guarda los productos: el inventario se pide siempre de nuevo', async () => {
    const store = makeStore();
    const persistor = persistStore(store);
    await rehydrated(persistor);

    store.dispatch(checkoutStarted({ productId: PRODUCT_ID }));
    await persistor.flush();

    expect(Object.keys(localStorage)).toEqual(['persist:checkout']);
  });

  it('al abrir la app recupera el paso y los datos guardados', async () => {
    const saved = makeStore();
    const savedPersistor = persistStore(saved);
    await rehydrated(savedPersistor);
    saved.dispatch(checkoutStarted({ productId: PRODUCT_ID }));
    saved.dispatch(contactChanged({ email: 'ana@example.com' }));
    await savedPersistor.flush();

    const reopened = makeStore();
    await rehydrated(persistStore(reopened));

    expect(reopened.getState().checkout).toMatchObject({
      step: 'PAYMENT_FORM',
      productId: PRODUCT_ID,
      contact: { email: 'ana@example.com' },
      config: { status: 'idle', data: null },
    });
  });

  it('guarda el id de la transacción en curso, pero no el estado del pago', async () => {
    const store = makeStore();
    const persistor = persistStore(store);
    await rehydrated(persistor);

    store.dispatch(placeOrder.pending('r'));
    store.dispatch(
      createTransaction.fulfilled(aTransaction(), 'r', {} as never),
    );
    await persistor.flush();

    expect(persistedCheckout()).toMatchObject({
      step: 'PROCESSING',
      transactionId: TRANSACTION_ID,
    });
    expect(persistedCheckout()).not.toHaveProperty('order');
  });
});
