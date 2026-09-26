import type { PaymentRequest } from '@application/ports/payment-gateway.port';
import { anAcceptanceContracts } from '@testing/fixtures/checkout.fixture';
import { aGatewayTransactionResponse } from '@testing/fixtures/gateway-transaction.fixture';
import {
  aMerchantResponse,
  jsonResponse,
} from '@testing/fixtures/merchant-response.fixture';
import { GATEWAY_TRANSACTION_ID } from '@testing/fixtures/transaction.fixture';
import { mockConfigService } from '@testing/mocks/config-service.mock';
import { integritySignature } from '@infrastructure/payment-gateway/integrity-signature';
import { PaymentGatewayHttpClient } from '@infrastructure/payment-gateway/payment-gateway.client';

const INTEGRITY_SECRET = 'test_integrity_0123456789abcdef';

describe('PaymentGatewayHttpClient', () => {
  let fetchMock: jest.SpyInstance;

  const clientWith = (baseUrl: string) =>
    new PaymentGatewayHttpClient(
      mockConfigService({
        PAYMENT_GATEWAY_BASE_URL: baseUrl,
        PAYMENT_GATEWAY_PUBLIC_KEY: 'pub_test_abc123',
        PAYMENT_GATEWAY_INTEGRITY_SECRET: INTEGRITY_SECRET,
        PAYMENT_GATEWAY_TIMEOUT_MS: 5_000,
        // Espera corta para los tests: hasta 3 consultas, cada 1 ms.
        PAYMENT_GATEWAY_POLL_TIMEOUT_MS: 3,
        PAYMENT_GATEWAY_POLL_INTERVAL_MS: 1,
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

  describe('getPayment', () => {
    it('consulta el cobro por su id, sin credenciales, y devuelve su estado', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse(
          aGatewayTransactionResponse({
            status: 'DECLINED',
            status_message: 'La transacción fue rechazada (Sandbox)',
          }),
        ),
      );

      const result = await clientWith('https://gateway.test/v1').getPayment(
        GATEWAY_TRANSACTION_ID,
      );

      expect(fetchMock).toHaveBeenCalledWith(
        `https://gateway.test/v1/transactions/${GATEWAY_TRANSACTION_ID}`,
        {
          headers: { Accept: 'application/json' },
          signal: expect.any(AbortSignal) as unknown,
        },
      );
      expect(result._unsafeUnwrap()).toEqual({
        gatewayTransactionId: GATEWAY_TRANSACTION_ID,
        status: 'DECLINED',
        statusMessage: 'La transacción fue rechazada (Sandbox)',
      });
    });

    it('falla con PAYMENT_GATEWAY_UNAVAILABLE si el cobro no existe en la pasarela', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({ error: { type: 'NOT_FOUND_ERROR' } }, 404),
      );

      const result = await clientWith('https://gateway.test/v1').getPayment(
        'no-existe',
      );

      expect(result._unsafeUnwrapErr().code).toBe(
        'PAYMENT_GATEWAY_UNAVAILABLE',
      );
    });
  });

  describe('charge', () => {
    const request: PaymentRequest = {
      reference: 'TX-019200000000700080000000000000A1',
      amountInCents: 20_040_000,
      currency: 'COP',
      customerEmail: 'ana@example.com',
      cardToken: 'tok_stagtest_5113_abc',
      installments: 1,
      acceptanceToken: 'end-user-policy-token',
      personalDataAuthToken: 'personal-data-auth-token',
    };
    const client = () => clientWith('https://gateway.test/v1');
    const created = (status: string) =>
      jsonResponse(aGatewayTransactionResponse({ status }), 201);
    const current = (status: string) =>
      jsonResponse(aGatewayTransactionResponse({ status }));

    it('crea el cobro con la llave pública y la firma de integridad', async () => {
      fetchMock.mockResolvedValueOnce(created('APPROVED'));

      await client().charge(request);

      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe('https://gateway.test/v1/transactions');
      expect(init).toMatchObject({
        method: 'POST',
        headers: { Authorization: 'Bearer pub_test_abc123' },
      });
      expect(JSON.parse(init.body as string)).toEqual({
        acceptance_token: 'end-user-policy-token',
        accept_personal_auth: 'personal-data-auth-token',
        amount_in_cents: 20_040_000,
        currency: 'COP',
        signature: integritySignature(request, INTEGRITY_SECRET),
        customer_email: 'ana@example.com',
        reference: 'TX-019200000000700080000000000000A1',
        payment_method: {
          type: 'CARD',
          token: 'tok_stagtest_5113_abc',
          installments: 1,
        },
      });
    });

    it('espera el estado final consultando el cobro', async () => {
      fetchMock
        .mockResolvedValueOnce(created('PENDING'))
        .mockResolvedValueOnce(current('PENDING'))
        .mockResolvedValueOnce(current('APPROVED'));

      const result = await client().charge(request);

      expect(result._unsafeUnwrap()).toEqual({
        gatewayTransactionId: GATEWAY_TRANSACTION_ID,
        status: 'APPROVED',
        statusMessage: null,
      });
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it('no consulta si la pasarela ya respondió un estado final', async () => {
      fetchMock.mockResolvedValueOnce(created('DECLINED'));

      const result = await client().charge(request);

      expect(result._unsafeUnwrap().status).toBe('DECLINED');
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('devuelve PENDING si el estado final no llega dentro de la espera', async () => {
      fetchMock
        .mockResolvedValueOnce(created('PENDING'))
        .mockResolvedValue(current('PENDING'));

      const result = await client().charge(request);

      expect(result._unsafeUnwrap()).toMatchObject({
        gatewayTransactionId: GATEWAY_TRANSACTION_ID,
        status: 'PENDING',
      });
      expect(fetchMock).toHaveBeenCalledTimes(1 + 3);
    });

    it('si falla una consulta conserva el cobro ya creado con su último estado', async () => {
      fetchMock
        .mockResolvedValueOnce(created('PENDING'))
        .mockRejectedValue(new TypeError('fetch failed'));

      const result = await client().charge(request);

      expect(result._unsafeUnwrap()).toMatchObject({
        gatewayTransactionId: GATEWAY_TRANSACTION_ID,
        status: 'PENDING',
      });
    });

    it('falla con PAYMENT_GATEWAY_REJECTED si la pasarela rechaza el cobro', async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse(
          {
            error: {
              type: 'INPUT_VALIDATION_ERROR',
              messages: { signature: ['La firma es inválida'] },
            },
          },
          422,
        ),
      );

      const result = await client().charge(request);

      expect(result._unsafeUnwrapErr().code).toBe('PAYMENT_GATEWAY_REJECTED');
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('falla con PAYMENT_GATEWAY_UNAVAILABLE si la pasarela no responde', async () => {
      fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'));

      const result = await client().charge(request);

      expect(result._unsafeUnwrapErr().code).toBe(
        'PAYMENT_GATEWAY_UNAVAILABLE',
      );
    });
  });
});
