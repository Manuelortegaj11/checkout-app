import { mockConfigService } from '@testing/mocks/config-service.mock';
import { ConfigCheckoutSettingsAdapter } from './checkout-settings.adapter';

describe('ConfigCheckoutSettingsAdapter', () => {
  it('entrega las tarifas configuradas', () => {
    const settings = new ConfigCheckoutSettingsAdapter(
      mockConfigService({
        BASE_FEE_IN_CENTS: 250_000,
        DELIVERY_FEE_IN_CENTS: 800_000,
      }),
    );

    expect(settings.getFees()).toEqual({
      baseFeeInCents: 250_000,
      deliveryFeeInCents: 800_000,
    });
  });

  it('admite un checkout sin tarifa base', () => {
    const settings = new ConfigCheckoutSettingsAdapter(
      mockConfigService({
        BASE_FEE_IN_CENTS: 0,
        DELIVERY_FEE_IN_CENTS: 500_000,
      }),
    );

    expect(settings.getFees().baseFeeInCents).toBe(0);
  });
});
