import { jsonResponse } from '@testing/fixtures/merchant-response.fixture';
import {
  getJson,
  postJson,
} from '@infrastructure/payment-gateway/payment-gateway.http';

describe('getJson', () => {
  const url = 'https://gateway.test/v1/merchants/pub_test_abc';
  let fetchMock: jest.SpyInstance;

  beforeEach(() => {
    fetchMock = jest.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchMock.mockRestore();
  });

  it('devuelve el cuerpo JSON de una respuesta 2xx', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: { id: 1 } }));

    const result = await getJson(url, 5_000);

    expect(result._unsafeUnwrap()).toEqual({ data: { id: 1 } });
  });

  it('pide JSON y aplica el timeout configurado', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}));

    await getJson(url, 5_000);

    expect(fetchMock).toHaveBeenCalledWith(url, {
      headers: { Accept: 'application/json' },
      signal: expect.any(AbortSignal) as unknown,
    });
  });

  it('traduce un fallo de red o un timeout a PAYMENT_GATEWAY_UNAVAILABLE', async () => {
    const timeout = new DOMException('The operation timed out', 'TimeoutError');
    fetchMock.mockRejectedValue(timeout);

    const result = await getJson(url, 5_000);

    expect(result._unsafeUnwrapErr()).toMatchObject({
      code: 'PAYMENT_GATEWAY_UNAVAILABLE',
      cause: timeout,
    });
  });

  it('traduce una respuesta no 2xx conservando estado y cuerpo para el log', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ error: { type: 'NOT_FOUND_ERROR' } }, 404),
    );

    const result = await getJson(url, 5_000);

    expect(result._unsafeUnwrapErr()).toMatchObject({
      code: 'PAYMENT_GATEWAY_UNAVAILABLE',
      cause: { status: 404, body: '{"error":{"type":"NOT_FOUND_ERROR"}}' },
    });
  });

  it('traduce un cuerpo que no es JSON a PAYMENT_GATEWAY_UNAVAILABLE', async () => {
    fetchMock.mockResolvedValue(new Response('<html>Bad gateway</html>'));

    const result = await getJson(url, 5_000);
    const error = result._unsafeUnwrapErr();

    expect(error.code).toBe('PAYMENT_GATEWAY_UNAVAILABLE');
    // El SyntaxError nace en el realm de fetch (Node), no en el de Jest: se compara por nombre.
    expect((error.cause as Error).name).toBe('SyntaxError');
  });

  it('sin política de reintentos hace un único intento', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: 'boom' }, 503));

    await getJson(url, 5_000);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  describe('con reintentos', () => {
    // Espera corta para los tests: 1 ms y luego 2 ms.
    const retry = { retries: 2, backoffMs: 1 };

    it.each([
      ['un 5xx', () => fetchMock.mockResolvedValueOnce(jsonResponse({}, 503))],
      ['un 429', () => fetchMock.mockResolvedValueOnce(jsonResponse({}, 429))],
      [
        'un fallo de red',
        () => fetchMock.mockRejectedValueOnce(new TypeError('fetch failed')),
      ],
    ])(
      'reintenta %s y devuelve la respuesta que llega bien',
      async (_, fail) => {
        fail();
        fetchMock.mockResolvedValueOnce(jsonResponse({ data: { id: 1 } }));

        const result = await getJson(url, 5_000, retry);

        expect(result._unsafeUnwrap()).toEqual({ data: { id: 1 } });
        expect(fetchMock).toHaveBeenCalledTimes(2);
      },
    );

    it('no reintenta un 4xx: la respuesta no cambiará', async () => {
      fetchMock.mockResolvedValue(jsonResponse({}, 404));

      const result = await getJson(url, 5_000, retry);

      expect(result._unsafeUnwrapErr()).toMatchObject({
        code: 'PAYMENT_GATEWAY_UNAVAILABLE',
        cause: { status: 404 },
      });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('agotados los reintentos, devuelve el último fallo con su estado', async () => {
      // Una respuesta nueva por intento: el cuerpo de cada una se lee una sola vez.
      fetchMock.mockImplementation(() =>
        Promise.resolve(jsonResponse({ error: 'boom' }, 503)),
      );

      const result = await getJson(url, 5_000, retry);

      expect(result._unsafeUnwrapErr()).toMatchObject({
        code: 'PAYMENT_GATEWAY_UNAVAILABLE',
        cause: { status: 503, body: '{"error":"boom"}' },
      });
      expect(fetchMock).toHaveBeenCalledTimes(1 + 2);
    });

    it('todos los intentos comparten el mismo tiempo límite', async () => {
      fetchMock
        .mockRejectedValueOnce(new TypeError('fetch failed'))
        .mockResolvedValueOnce(jsonResponse({}));

      await getJson(url, 5_000, retry);

      const [[, first], [, second]] = fetchMock.mock.calls as [
        string,
        RequestInit,
      ][];
      expect(second.signal).toBe(first.signal);
    });

    it('si el tiempo límite vence durante la espera, no reintenta', async () => {
      fetchMock.mockResolvedValue(jsonResponse({}, 503));

      const result = await getJson(url, 20, {
        retries: 2,
        backoffMs: 60_000,
      });

      expect(result._unsafeUnwrapErr().code).toBe(
        'PAYMENT_GATEWAY_UNAVAILABLE',
      );
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('si el tiempo límite vence durante una petición, no reintenta', async () => {
      fetchMock.mockImplementation(
        (_url: string, { signal }: RequestInit) =>
          new Promise((_resolve, reject) => {
            signal?.addEventListener('abort', () =>
              reject(signal.reason as DOMException),
            );
          }),
      );

      const result = await getJson(url, 20, retry);

      expect(result._unsafeUnwrapErr()).toMatchObject({
        code: 'PAYMENT_GATEWAY_UNAVAILABLE',
        cause: { name: 'TimeoutError' },
      });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });
});

describe('postJson', () => {
  const url = 'https://gateway.test/v1/transactions';
  const options = { bearerToken: 'pub_test_abc123', timeoutMs: 5_000 };
  let fetchMock: jest.SpyInstance;

  beforeEach(() => {
    fetchMock = jest.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchMock.mockRestore();
  });

  it('envía el cuerpo como JSON, autenticado, y devuelve la respuesta', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: { id: '1' } }, 201));

    const result = await postJson(url, { amount_in_cents: 100 }, options);

    expect(result._unsafeUnwrap()).toEqual({ data: { id: '1' } });
    expect(fetchMock).toHaveBeenCalledWith(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: 'Bearer pub_test_abc123',
      },
      body: '{"amount_in_cents":100}',
      signal: expect.any(AbortSignal) as unknown,
    });
  });

  it('traduce un 4xx a PAYMENT_GATEWAY_REJECTED con estado y cuerpo para el log', async () => {
    const body = {
      error: {
        type: 'INPUT_VALIDATION_ERROR',
        messages: { reference: ['La referencia ya ha sido usada'] },
      },
    };
    fetchMock.mockResolvedValue(jsonResponse(body, 422));

    const result = await postJson(url, {}, options);

    expect(result._unsafeUnwrapErr()).toMatchObject({
      code: 'PAYMENT_GATEWAY_REJECTED',
      cause: { status: 422, body: JSON.stringify(body) },
    });
  });

  it('traduce un 5xx a PAYMENT_GATEWAY_UNAVAILABLE', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: 'boom' }, 503));

    const result = await postJson(url, {}, options);

    expect(result._unsafeUnwrapErr()).toMatchObject({
      code: 'PAYMENT_GATEWAY_UNAVAILABLE',
      cause: { status: 503 },
    });
  });

  it('traduce un fallo de red o un timeout a PAYMENT_GATEWAY_UNAVAILABLE', async () => {
    const cause = new TypeError('fetch failed');
    fetchMock.mockRejectedValue(cause);

    const result = await postJson(url, {}, options);

    expect(result._unsafeUnwrapErr()).toMatchObject({
      code: 'PAYMENT_GATEWAY_UNAVAILABLE',
      cause,
    });
  });
});
