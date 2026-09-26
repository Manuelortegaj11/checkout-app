import { Injectable, type Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CHECKOUT_SETTINGS,
  type CheckoutFees,
  type CheckoutSettingsPort,
} from '@application/ports/checkout-settings.port';
import type { EnvironmentVariables } from '@config/env.validation';

/** Tarifas del checkout leídas de las variables de entorno (validadas al arrancar). */
@Injectable()
export class ConfigCheckoutSettingsAdapter implements CheckoutSettingsPort {
  constructor(
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  getFees(): CheckoutFees {
    return {
      baseFeeInCents: this.config.get('BASE_FEE_IN_CENTS', { infer: true }),
      deliveryFeeInCents: this.config.get('DELIVERY_FEE_IN_CENTS', {
        infer: true,
      }),
    };
  }
}

export const CHECKOUT_SETTINGS_PROVIDER: Provider = {
  provide: CHECKOUT_SETTINGS,
  useClass: ConfigCheckoutSettingsAdapter,
};
