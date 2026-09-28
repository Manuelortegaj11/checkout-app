import type {
  AcceptanceContracts,
  PaymentGatewayPublicSettings,
} from '@application/ports/payment-gateway.port';
import type { Currency } from '@domain/constants/currency.constants';

export interface CheckoutConfigOutput {
  readonly currency: Currency;
  readonly baseFeeInCents: number;
  readonly deliveryFeeInCents: number;
  readonly acceptance: AcceptanceContracts;
  readonly paymentGateway: PaymentGatewayPublicSettings;
}
