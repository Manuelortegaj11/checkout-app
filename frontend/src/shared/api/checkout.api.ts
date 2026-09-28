import { apiUrl, requestJson } from './http-client';
import type { PaymentGatewaySettings } from './payment-gateway.api';

export interface AcceptanceContract {
  token: string;
  url: string;
}

export interface CheckoutConfig {
  currency: string;
  baseFeeInCents: number;
  deliveryFeeInCents: number;
  acceptance: {
    endUserPolicy: AcceptanceContract;
    personalDataAuth: AcceptanceContract;
  };
  paymentGateway: PaymentGatewaySettings;
}

export const checkoutApi = {
  getConfig: (): Promise<CheckoutConfig> =>
    requestJson<CheckoutConfig>(apiUrl('/checkout/config')),
};
