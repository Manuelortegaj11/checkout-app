import {
  initialProductsState,
  productsReducer,
  type ProductsState,
} from '@features/products/products.slice';
import { fetchProducts } from '@features/products/products.thunks';
import { aProduct } from '@testing/fixtures/product.fixture';

const loadedState = (): ProductsState => ({
  items: [aProduct()],
  status: 'succeeded',
  errorCode: null,
});

describe('productsReducer', () => {
  it('empieza sin productos y sin cargar', () => {
    expect(productsReducer(undefined, { type: '@@INIT' })).toEqual(
      initialProductsState,
    );
  });

  it('pending marca la carga, limpia el error y conserva los productos anteriores', () => {
    const state = productsReducer(
      { ...loadedState(), status: 'failed', errorCode: 'TIMEOUT' },
      fetchProducts.pending('request-id'),
    );

    expect(state).toEqual({
      items: [aProduct()],
      status: 'loading',
      errorCode: null,
    });
  });

  it('fulfilled guarda el inventario recibido', () => {
    const inventory = [aProduct(), aProduct({ id: '2', stock: 0 })];

    const state = productsReducer(
      { ...initialProductsState, status: 'loading' },
      fetchProducts.fulfilled(inventory, 'request-id'),
    );

    expect(state).toEqual({
      items: inventory,
      status: 'succeeded',
      errorCode: null,
    });
  });

  it('rejected guarda el code del error', () => {
    const state = productsReducer(
      { ...initialProductsState, status: 'loading' },
      fetchProducts.rejected(null, 'request-id', undefined, 'NETWORK_ERROR'),
    );

    expect(state).toMatchObject({
      status: 'failed',
      errorCode: 'NETWORK_ERROR',
    });
  });

  it('rejected sin code (un error no previsto) usa UNEXPECTED_ERROR', () => {
    const state = productsReducer(
      { ...initialProductsState, status: 'loading' },
      fetchProducts.rejected(new Error('bug'), 'request-id'),
    );

    expect(state.errorCode).toBe('UNEXPECTED_ERROR');
  });
});
