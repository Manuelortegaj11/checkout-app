import type {
  AcceptanceContracts,
  PaymentGatewayPublicSettings,
} from '@application/ports/payment-gateway.port';
import type { Currency } from '@domain/constants/currency.constants';

/**
 * Lo que el frontend necesita para cobrar: las tarifas del resumen, los
 * contratos que el cliente acepta y cómo tokenizar la tarjeta en la pasarela.
 */
export interface CheckoutConfigOutput {
  readonly currency: Currency;
  readonly baseFeeInCents: number;
  readonly deliveryFeeInCents: number;
  readonly acceptance: AcceptanceContracts;
  readonly paymentGateway: PaymentGatewayPublicSettings;
}
