import { mockFetch } from './fetch.helper';

type Route = (init?: RequestInit) => Response | Promise<Response>;

/** URL de cualquier forma de petición que acepta fetch. */
export const urlOf = (input: RequestInfo | URL): string =>
  typeof input === 'string'
    ? input
    : input instanceof URL
      ? input.href
      : input.url;

/**
 * Sustituye la red por rutas simuladas, con la clave "MÉTODO url"
 * ("GET /api/products"). Una petición sin ruta falla, así ninguna llamada
 * inesperada pasa desapercibida.
 */
export const fakeNetwork = (routes: Record<string, Route>) => {
  const fetchMock = mockFetch();
  fetchMock.mockImplementation((input, init) => {
    const key = `${init?.method ?? 'GET'} ${urlOf(input)}`;
    const route = routes[key];
    return route
      ? Promise.resolve(route(init))
      : Promise.reject(new Error(`Petición inesperada: ${key}`));
  });
  return fetchMock;
};

/** Peticiones hechas a la red simulada, como "MÉTODO url". */
export const requestsMade = (
  fetchMock: jest.MockedFunction<typeof fetch>,
): string[] =>
  fetchMock.mock.calls.map(
    ([input, init]) => `${init?.method ?? 'GET'} ${urlOf(input)}`,
  );

/** Cuerpos enviados a las rutas cuya url empieza por `prefix`. */
export const bodiesSentTo = (
  fetchMock: jest.MockedFunction<typeof fetch>,
  prefix: string,
): string[] =>
  fetchMock.mock.calls
    .filter(([input]) => urlOf(input).startsWith(prefix))
    .map(([, init]) => (typeof init?.body === 'string' ? init.body : ''));
