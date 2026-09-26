/** Respuesta mínima de fetch: lo único que lee el cliente HTTP (ok, status y el texto). */
export const fakeResponse = (status: number, body?: unknown): Response => {
  const text =
    body === undefined
      ? ''
      : typeof body === 'string'
        ? body
        : JSON.stringify(body);

  return {
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(text),
  } as Response;
};

/** Sustituye el fetch global (jsdom no lo trae) por un doble que cada test programa. */
export const mockFetch = (): jest.MockedFunction<typeof fetch> => {
  const fetchMock = jest.fn<
    ReturnType<typeof fetch>,
    Parameters<typeof fetch>
  >();
  globalThis.fetch = fetchMock;
  return fetchMock;
};

/** fetch que no responde hasta que se aborta su señal, como una petición colgada. */
export const hangingFetch: typeof fetch = (_input, init) =>
  new Promise((_resolve, reject) => {
    init?.signal?.addEventListener('abort', () =>
      reject(new DOMException('The operation was aborted', 'AbortError')),
    );
  });
