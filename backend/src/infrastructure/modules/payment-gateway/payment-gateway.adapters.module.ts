import { Module } from '@nestjs/common';
import { PAYMENT_GATEWAY_PROVIDER } from '@infrastructure/payment-gateway/payment-gateway.client';

const providers = [PAYMENT_GATEWAY_PROVIDER];

/** Adapter de la pasarela de pagos. Lo importan los contextos que la usan. */
@Module({
  providers,
  exports: providers,
})
export class PaymentGatewayAdaptersModule {}
