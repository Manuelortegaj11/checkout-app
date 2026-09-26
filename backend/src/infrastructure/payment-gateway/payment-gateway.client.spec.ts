import { anAcceptanceContracts } from '@testing/fixtures/checkout.fixture';
import {
  aMerchantResponse,
  jsonResponse,
} from '@testing/fixtures/merchant-response.fixture';
import { mockConfigService } from '@testing/mocks/config-service.mock';
import { PaymentGatewayHttpClient } from './payment-gateway.client';

describe('PaymentGatewayHttpClient', () => {
  let fetchMock: jest.SpyInstance;

  const clientWith = (baseUrl: string) =>
    new PaymentGatewayHttpClient(
      mockConfigService({
        PAYMENT_GATEWAY_BASE_URL: baseUrl,
        PAYMENT_GATEWAY_PUBLIC_KEY: 'pub_test_abc123',
        PAYMENT_GATEWAY_TIMEOUT_MS: 5_000,
      }),
    );

  beforeEach(() => {
    fetchMock = jest.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchMock.mockRestore();
  });

  describe('getAcceptanceContracts', () => {
    it('consulta el comercio con la llave pública y devuelve sus contratos', async () => {
      fetchMock.mockResolvedValue(jsonResponse(aMerchantResponse()));

      const result = await clientWith(
        'https://gateway.test/v1',
      ).getAcceptanceContracts();

      expect(fetchMock).toHaveBeenCalledWith(
        'https://gateway.test/v1/merchants/pub_test_abc123',
        expect.any(Object),
      );
      expect(result._unsafeUnwrap()).toEqual(anAcceptanceContracts());
    });

    it('tolera una URL base configurada con barra final', async () => {
      fetchMock.mockResolvedValue(jsonResponse(aMerchantResponse()));

      await clientWith('https://gateway.test/v1/').getAcceptanceContracts();

      expect(fetchMock).toHaveBeenCalledWith(
        'https://gateway.test/v1/merchants/pub_test_abc123',
        expect.any(Object),
      );
    });

    it('falla con PAYMENT_GATEWAY_UNAVAILABLE si la pasarela rechaza la llave', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({ error: { type: 'NOT_FOUND_ERROR' } }, 404),
      );

      const result = await clientWith(
        'https://gateway.test/v1',
      ).getAcceptanceContracts();

      expect(result._unsafeUnwrapErr().code).toBe(
        'PAYMENT_GATEWAY_UNAVAILABLE',
      );
    });
  });
});
