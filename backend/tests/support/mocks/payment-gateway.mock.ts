import type { PaymentGatewayPort } from '@application/ports/payment-gateway.port';

/** Doble de la pasarela: cada test decide qué devuelve con okAsync / errAsync. */
export const mockPaymentGateway = (): jest.Mocked<PaymentGatewayPort> => ({
  getAcceptanceContracts: jest.fn(),
  charge: jest.fn(),
  getPayment: jest.fn(),
});
