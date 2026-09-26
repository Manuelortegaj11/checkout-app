import { fetchCheckoutConfig } from '@features/checkout/checkout.thunks';
import { ApiError } from '@shared/api/api-error';
import { checkoutApi } from '@shared/api/checkout.api';
import { makeStore } from '@store/index';
import { aCheckoutConfig } from '@testing/fixtures/checkout.fixture';

describe('fetchCheckoutConfig', () => {
  it('guarda la configuración en el store', async () => {
    jest.spyOn(checkoutApi, 'getConfig').mockResolvedValue(aCheckoutConfig());
    const store = makeStore();

    await store.dispatch(fetchCheckoutConfig());

    expect(store.getState().checkout.config).toEqual({
      status: 'succeeded',
      data: aCheckoutConfig(),
      errorCode: null,
    });
  });

  it('rechaza con el code del ApiError', async () => {
    jest
      .spyOn(checkoutApi, 'getConfig')
      .mockRejectedValue(
        new ApiError('PAYMENT_GATEWAY_UNAVAILABLE', 502, 'down'),
      );
    const store = makeStore();

    const action = await store.dispatch(fetchCheckoutConfig());

    expect(action.payload).toBe('PAYMENT_GATEWAY_UNAVAILABLE');
  });

  it('no lanza una segunda petición mientras la primera sigue en curso', async () => {
    const getConfig = jest
      .spyOn(checkoutApi, 'getConfig')
      .mockResolvedValue(aCheckoutConfig());
    const store = makeStore();

    await Promise.all([
      store.dispatch(fetchCheckoutConfig()),
      store.dispatch(fetchCheckoutConfig()),
    ]);

    expect(getConfig).toHaveBeenCalledTimes(1);
  });
});
