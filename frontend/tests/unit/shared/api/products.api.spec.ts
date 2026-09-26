import { productsApi } from '@shared/api/products.api';
import { aProduct } from '@testing/fixtures/product.fixture';
import { fakeResponse, mockFetch } from '@testing/helpers/fetch.helper';

describe('productsApi', () => {
  it('list pide el inventario a GET /api/products', async () => {
    const fetchMock = mockFetch();
    const inventory = [aProduct(), aProduct({ id: '2', stock: 0 })];
    fetchMock.mockResolvedValue(fakeResponse(200, inventory));

    await expect(productsApi.list()).resolves.toEqual(inventory);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/products',
      expect.objectContaining({ method: 'GET' }),
    );
  });
});
