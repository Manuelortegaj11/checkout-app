import type { PaymentGatewayPort } from '@application/ports/payment-gateway.port';
import { aPaymentGatewayPublicSettings } from '@testing/fixtures/checkout.fixture';

export const mockPaymentGateway = (): jest.Mocked<PaymentGatewayPort> => ({
  getPublicSettings: jest.fn().mockReturnValue(aPaymentGatewayPublicSettings()),
  getAcceptanceContracts: jest.fn(),
  charge: jest.fn(),
  waitForFinalStatus: jest.fn(),
  getPayment: jest.fn(),
});
