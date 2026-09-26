import type { AcceptanceContracts } from '@application/ports/payment-gateway.port';
import type { Currency } from '@domain/constants/currency.constants';

/** Lo que el frontend necesita para armar el resumen y las casillas de aceptación. */
export interface CheckoutConfigOutput {
  readonly currency: Currency;
  readonly baseFeeInCents: number;
  readonly deliveryFeeInCents: number;
  readonly acceptance: AcceptanceContracts;
}
