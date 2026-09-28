import {
  selectProducts,
  selectProductsErrorCode,
  selectProductsStatus,
} from '@features/products/products.selectors';
import { makeStore } from '@store/index';
import { aProduct } from '@testing/fixtures/product.fixture';

describe('selectores de productos', () => {
  const state = makeStore({
    products: {
      items: [aProduct()],
      status: 'failed',
      errorCode: 'NETWORK_ERROR',
    },
  }).getState();

  it('selectProducts devuelve el inventario', () => {
    expect(selectProducts(state)).toEqual([aProduct()]);
  });

  it('selectProductsStatus devuelve el estado de la carga', () => {
    expect(selectProductsStatus(state)).toBe('failed');
  });

  it('selectProductsErrorCode devuelve el code del último fallo', () => {
    expect(selectProductsErrorCode(state)).toBe('NETWORK_ERROR');
  });
});
