import { Module } from '@nestjs/common';
import { CHECKOUT_SETTINGS_PROVIDER } from '@infrastructure/settings/checkout-settings.adapter';

const providers = [CHECKOUT_SETTINGS_PROVIDER];

@Module({
  providers,
  exports: providers,
})
export class CheckoutAdaptersModule {}
