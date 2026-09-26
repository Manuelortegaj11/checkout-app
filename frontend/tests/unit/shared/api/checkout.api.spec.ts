import { checkoutApi } from '@shared/api/checkout.api';
import { aCheckoutConfig } from '@testing/fixtures/checkout.fixture';
import { fakeResponse, mockFetch } from '@testing/helpers/fetch.helper';

describe('checkoutApi', () => {
  it('getConfig pide la configuración a GET /api/checkout/config', async () => {
    const fetchMock = mockFetch();
    fetchMock.mockResolvedValue(fakeResponse(200, aCheckoutConfig()));

    await expect(checkoutApi.getConfig()).resolves.toEqual(aCheckoutConfig());
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/checkout/config',
      expect.objectContaining({ method: 'GET' }),
    );
  });
});
