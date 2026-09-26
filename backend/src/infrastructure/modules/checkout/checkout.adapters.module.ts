import { Module } from '@nestjs/common';
import { CHECKOUT_SETTINGS_PROVIDER } from '@infrastructure/settings/checkout-settings.adapter';

const providers = [CHECKOUT_SETTINGS_PROVIDER];

/** Tarifas del checkout. Las transacciones lo importan para calcular el total. */
@Module({
  providers,
  exports: providers,
})
export class CheckoutAdaptersModule {}
