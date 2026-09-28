import { mockFetch } from './fetch.helper';

type Route = (init?: RequestInit) => Response | Promise<Response>;

export const urlOf = (input: RequestInfo | URL): string =>
  typeof input === 'string'
    ? input
    : input instanceof URL
      ? input.href
      : input.url;

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

export const requestsMade = (
  fetchMock: jest.MockedFunction<typeof fetch>,
): string[] =>
  fetchMock.mock.calls.map(
    ([input, init]) => `${init?.method ?? 'GET'} ${urlOf(input)}`,
  );

export const bodiesSentTo = (
  fetchMock: jest.MockedFunction<typeof fetch>,
  prefix: string,
): string[] =>
  fetchMock.mock.calls
    .filter(([input]) => urlOf(input).startsWith(prefix))
    .map(([, init]) => (typeof init?.body === 'string' ? init.body : ''));
