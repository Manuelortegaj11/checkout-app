import { fetchProducts } from '@features/products/products.thunks';
import { ApiError } from '@shared/api/api-error';
import { productsApi } from '@shared/api/products.api';
import { makeStore } from '@store/index';
import { aProduct } from '@testing/fixtures/product.fixture';

describe('fetchProducts', () => {
  it('carga el inventario en el store', async () => {
    const inventory = [aProduct(), aProduct({ id: '2' })];
    jest.spyOn(productsApi, 'list').mockResolvedValue(inventory);
    const store = makeStore();

    await store.dispatch(fetchProducts());

    expect(store.getState().products).toEqual({
      items: inventory,
      status: 'succeeded',
      errorCode: null,
    });
  });

  it('rechaza con el code del ApiError', async () => {
    jest
      .spyOn(productsApi, 'list')
      .mockRejectedValue(new ApiError('TIMEOUT', null, 'slow'));
    const store = makeStore();

    const action = await store.dispatch(fetchProducts());

    expect(action.payload).toBe('TIMEOUT');
    expect(store.getState().products).toMatchObject({
      status: 'failed',
      errorCode: 'TIMEOUT',
    });
  });

  it('no lanza una segunda petición mientras la primera sigue en curso', async () => {
    const list = jest.spyOn(productsApi, 'list').mockResolvedValue([]);
    const store = makeStore();

    await Promise.all([
      store.dispatch(fetchProducts()),
      store.dispatch(fetchProducts()),
    ]);

    expect(list).toHaveBeenCalledTimes(1);
  });
});
