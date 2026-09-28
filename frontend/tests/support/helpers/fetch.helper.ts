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

export const mockFetch = (): jest.MockedFunction<typeof fetch> => {
  const fetchMock = jest.fn<
    ReturnType<typeof fetch>,
    Parameters<typeof fetch>
  >();
  globalThis.fetch = fetchMock;
  return fetchMock;
};

export const hangingFetch: typeof fetch = (_input, init) =>
  new Promise((_resolve, reject) => {
    init?.signal?.addEventListener('abort', () =>
      reject(new DOMException('The operation was aborted', 'AbortError')),
    );
  });
