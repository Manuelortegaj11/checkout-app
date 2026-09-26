import { Module } from '@nestjs/common';
import { CHECKOUT_SETTINGS } from '@application/ports/checkout-settings.port';
import { PAYMENT_GATEWAY } from '@application/ports/payment-gateway.port';
import { GetCheckoutConfigUseCase } from '@application/use-cases/checkout/get-checkout-config.use-case';
import { PaymentGatewayAdaptersModule } from '../payment-gateway/payment-gateway.adapters.module';
import { useCaseProvider } from '../use-case.provider';
import { CheckoutAdaptersModule } from './checkout.adapters.module';

export const GET_CHECKOUT_CONFIG_USE_CASE_PROVIDER = useCaseProvider(
  GetCheckoutConfigUseCase,
  [CHECKOUT_SETTINGS, PAYMENT_GATEWAY],
);

const providers = [GET_CHECKOUT_CONFIG_USE_CASE_PROVIDER];

@Module({
  imports: [CheckoutAdaptersModule, PaymentGatewayAdaptersModule],
  providers,
  exports: providers,
})
export class CheckoutUseCasesModule {}
