import { HttpStatus, Logger } from '@nestjs/common';
import type { GetCheckoutConfigUseCase } from '@application/use-cases/checkout/get-checkout-config.use-case';
import { paymentGatewayUnavailable } from '@infrastructure/payment-gateway/payment-gateway.errors';
import { errAsync, okAsync } from '@shared/result';
import { aCheckoutConfigOutput } from '@testing/fixtures/checkout.fixture';
import { mockUseCase } from '@testing/mocks/use-case.mock';
import { CheckoutController } from '@infrastructure/http/controllers/checkout.controller';

describe('CheckoutController', () => {
  const getCheckoutConfig = mockUseCase<GetCheckoutConfigUseCase>();
  const controller = new CheckoutController(getCheckoutConfig);

  it('devuelve las tarifas y los contratos del caso de uso', async () => {
    getCheckoutConfig.execute.mockReturnValue(okAsync(aCheckoutConfigOutput()));

    await expect(controller.config()).resolves.toEqual(aCheckoutConfigOutput());
  });

  it('sale del riel con 502 PAYMENT_GATEWAY_UNAVAILABLE si la pasarela no responde', async () => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    getCheckoutConfig.execute.mockReturnValue(
      errAsync(paymentGatewayUnavailable({ status: 500 })),
    );

    await expect(controller.config()).rejects.toMatchObject({
      status: HttpStatus.BAD_GATEWAY,
      response: {
        code: 'PAYMENT_GATEWAY_UNAVAILABLE',
        message: 'Payment gateway is unavailable',
      },
    });
  });
});
