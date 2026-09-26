import type { CheckoutConfigOutput } from '@application/dtos/checkout/checkout-config.output';
import type { CheckoutSettingsPort } from '@application/ports/checkout-settings.port';
import type { PaymentGatewayPort } from '@application/ports/payment-gateway.port';
import type { UseCase } from '@application/ports/use-case.port';
import { STORE_CURRENCY } from '@domain/constants/currency.constants';
import type { AppError } from '@shared/errors/app-error';
import type { ResultAsync } from '@shared/result';

/**
 * Configuración del checkout: tarifas vigentes y contratos que el cliente
 * debe aceptar. Falla si la pasarela no entrega los contratos.
 */
export class GetCheckoutConfigUseCase implements UseCase<
  void,
  CheckoutConfigOutput
> {
  constructor(
    private readonly settings: CheckoutSettingsPort,
    private readonly paymentGateway: PaymentGatewayPort,
  ) {}

  execute(): ResultAsync<CheckoutConfigOutput, AppError> {
    const { baseFeeInCents, deliveryFeeInCents } = this.settings.getFees();

    return this.paymentGateway.getAcceptanceContracts().map((acceptance) => ({
      currency: STORE_CURRENCY,
      baseFeeInCents,
      deliveryFeeInCents,
      acceptance,
    }));
  }
}
