import { apiUrl, requestJson } from './http-client';
import type { PaymentGatewaySettings } from './payment-gateway.api';

/** Documento legal que el cliente acepta antes de pagar. */
export interface AcceptanceContract {
  /** Se envía al pagar; es de un solo uso. */
  token: string;
  url: string;
}

/** Configuración del checkout (`GET /api/checkout/config`). */
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
  /**
   * Tarifas, contratos vigentes y datos públicos de la pasarela. Los tokens de
   * aceptación son de un solo uso: se pide una configuración nueva por compra.
   */
  getConfig: (): Promise<CheckoutConfig> =>
    requestJson<CheckoutConfig>(apiUrl('/checkout/config')),
};
