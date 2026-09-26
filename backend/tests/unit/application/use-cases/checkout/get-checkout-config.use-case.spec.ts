import { appError } from '@shared/errors/app-error';
import { errAsync, okAsync } from '@shared/result';
import { anAcceptanceContracts } from '@testing/fixtures/checkout.fixture';
import { mockCheckoutSettings } from '@testing/mocks/checkout-settings.mock';
import { mockPaymentGateway } from '@testing/mocks/payment-gateway.mock';
import { GetCheckoutConfigUseCase } from '@application/use-cases/checkout/get-checkout-config.use-case';

describe('GetCheckoutConfigUseCase', () => {
  const settings = mockCheckoutSettings();
  const paymentGateway = mockPaymentGateway();
  const useCase = new GetCheckoutConfigUseCase(settings, paymentGateway);

  it('combina las tarifas vigentes con los contratos de la pasarela', async () => {
    paymentGateway.getAcceptanceContracts.mockReturnValue(
      okAsync(anAcceptanceContracts()),
    );

    const result = await useCase.execute();

    expect(result._unsafeUnwrap()).toEqual({
      currency: 'COP',
      baseFeeInCents: 250_000,
      deliveryFeeInCents: 800_000,
      acceptance: anAcceptanceContracts(),
    });
  });

  it('usa las tarifas que entregue la configuración', async () => {
    const customSettings = mockCheckoutSettings({
      baseFeeInCents: 0,
      deliveryFeeInCents: 1_200_000,
    });
    paymentGateway.getAcceptanceContracts.mockReturnValue(
      okAsync(anAcceptanceContracts()),
    );

    const result = await new GetCheckoutConfigUseCase(
      customSettings,
      paymentGateway,
    ).execute();

    expect(result._unsafeUnwrap()).toMatchObject({
      baseFeeInCents: 0,
      deliveryFeeInCents: 1_200_000,
    });
  });

  it('propaga el error si la pasarela no entrega los contratos', async () => {
    const unavailable = appError(
      'EXTERNAL_SERVICE',
      'PAYMENT_GATEWAY_UNAVAILABLE',
      'Payment gateway is unavailable',
    );
    paymentGateway.getAcceptanceContracts.mockReturnValue(
      errAsync(unavailable),
    );

    const result = await useCase.execute();

    expect(result._unsafeUnwrapErr()).toBe(unavailable);
  });
});
