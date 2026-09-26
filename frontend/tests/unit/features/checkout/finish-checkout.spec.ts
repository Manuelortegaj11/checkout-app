import { finishCheckout } from '@features/checkout/finish-checkout';
import { productsApi } from '@shared/api/products.api';
import { makeStore } from '@store/index';
import {
  aCheckoutState,
  aTokenizedCard,
} from '@testing/fixtures/checkout.fixture';
import { aProduct, PRODUCT_ID } from '@testing/fixtures/product.fixture';
import { TRANSACTION_ID } from '@testing/fixtures/transaction.fixture';

describe('finishCheckout', () => {
  it('vuelve a la tienda y pide el inventario actualizado', async () => {
    const list = jest
      .spyOn(productsApi, 'list')
      .mockResolvedValue([aProduct({ stock: 11 })]);
    const store = makeStore({
      checkout: aCheckoutState({
        step: 'RESULT',
        productId: PRODUCT_ID,
        quantity: 2,
        card: aTokenizedCard(),
        transactionId: TRANSACTION_ID,
      }),
    });

    store.dispatch(finishCheckout());
    await Promise.resolve();

    expect(store.getState().checkout).toMatchObject({
      step: 'PRODUCT',
      productId: null,
      quantity: 1,
      card: null,
      transactionId: null,
    });
    expect(list).toHaveBeenCalledTimes(1);
  });
});
