import { initialCheckoutState } from '@features/checkout/checkout.slice';
import { initialProductsState } from '@features/products/products.slice';
import { makeStore, store } from '@store/index';
import { aProduct } from '@testing/fixtures/product.fixture';

describe('makeStore', () => {
  it('crea el store con el estado inicial de cada slice', () => {
    expect(makeStore().getState()).toEqual({
      products: initialProductsState,
      checkout: initialCheckoutState,
    });
  });

  it('acepta un estado inicial para las pruebas', () => {
    const products = {
      items: [aProduct()],
      status: 'succeeded' as const,
      errorCode: null,
    };

    expect(makeStore({ products }).getState().products).toEqual(products);
  });
});

describe('store', () => {
  it('es el store de la aplicación, con el estado inicial de cada slice', () => {
    const { products, checkout } = store.getState();

    expect(products).toEqual(initialProductsState);
    // El checkout del store de la app además lleva los metadatos de redux-persist.
    expect(checkout).toMatchObject(initialCheckoutState);
  });
});
