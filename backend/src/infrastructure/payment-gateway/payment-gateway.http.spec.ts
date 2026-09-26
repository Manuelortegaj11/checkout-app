import { jsonResponse } from '@testing/fixtures/merchant-response.fixture';
import { getJson, postJson } from './payment-gateway.http';

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
