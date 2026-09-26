import { ApiError } from '@shared/api/api-error';
import { apiUrl, requestJson } from '@shared/api/http-client';
import {
  fakeResponse,
  hangingFetch,
  mockFetch,
} from '@testing/helpers/fetch.helper';

describe('apiUrl', () => {
  it('antepone el prefijo de la API, servida en el mismo origen', () => {
    expect(apiUrl('/products')).toBe('/api/products');
  });
});

describe('requestJson', () => {
  let fetchMock: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    fetchMock = mockFetch();
  });

  it('hace un GET que acepta JSON y devuelve el cuerpo', async () => {
    fetchMock.mockResolvedValue(fakeResponse(200, [{ id: '1' }]));

    await expect(requestJson('/api/products')).resolves.toEqual([{ id: '1' }]);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/products',
      expect.objectContaining({
        method: 'GET',
        headers: { Accept: 'application/json' },
        body: undefined,
      }),
    );
  });

  it('envía el cuerpo como JSON y añade las cabeceras pedidas', async () => {
    fetchMock.mockResolvedValue(fakeResponse(201, { id: '1' }));

    await requestJson('/api/transactions', {
      method: 'POST',
      body: { quantity: 1 },
      headers: { Authorization: 'Bearer pub_test' },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/transactions',
      expect.objectContaining({
        method: 'POST',
        body: '{"quantity":1}',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: 'Bearer pub_test',
        },
      }),
    );
  });

  it('convierte el error de la API en un ApiError con su code y su status', async () => {
    fetchMock.mockResolvedValue(
      fakeResponse(409, { code: 'OUT_OF_STOCK', message: 'No units left' }),
    );

    const error = await requestJson('/api/transactions').catch(
      (e: unknown) => e,
    );

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      code: 'OUT_OF_STOCK',
      status: 409,
      message: 'No units left',
    });
  });

  it.each([
    ['sin cuerpo', undefined],
    ['con HTML de un proxy', '<html>Bad Gateway</html>'],
    ['con JSON sin la forma del contrato', { error: 'boom' }],
  ])(
    'un error HTTP %s es UNEXPECTED_ERROR con su status',
    async (_case, body) => {
      fetchMock.mockResolvedValue(fakeResponse(502, body));

      await expect(requestJson('/api/products')).rejects.toMatchObject({
        code: 'UNEXPECTED_ERROR',
        status: 502,
      });
    },
  );

  it('una respuesta correcta que no es JSON es UNEXPECTED_ERROR', async () => {
    fetchMock.mockResolvedValue(fakeResponse(200, '<html></html>'));

    await expect(requestJson('/api/products')).rejects.toMatchObject({
      code: 'UNEXPECTED_ERROR',
      status: 200,
    });
  });

  it('sin conexión es NETWORK_ERROR, sin status', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(requestJson('/api/products')).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
      status: null,
    });
  });

  describe('con tiempo límite', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('aborta la petición que tarda más de timeoutMs: TIMEOUT', async () => {
      fetchMock.mockImplementation(hangingFetch);

      const request = requestJson('/api/products', { timeoutMs: 5_000 });
      jest.advanceTimersByTime(5_000);

      await expect(request).rejects.toMatchObject({
        code: 'TIMEOUT',
        status: null,
      });
    });

    it('cancela el temporizador cuando la respuesta llega a tiempo', async () => {
      fetchMock.mockResolvedValue(fakeResponse(200, []));

      await requestJson('/api/products');

      expect(jest.getTimerCount()).toBe(0);
    });
  });
});
