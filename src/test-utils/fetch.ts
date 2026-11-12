export interface MockResponseInit {
  status?: number;
  /** Make response.json() reject, simulating a malformed body. */
  invalidJson?: boolean;
}

/** A minimal fetch Response stand-in: only what our client reads. */
export function mockResponse(
  body: unknown,
  { status = 200, invalidJson = false }: MockResponseInit = {},
) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: invalidJson
      ? () => Promise.reject(new SyntaxError('Unexpected token'))
      : () => Promise.resolve(body),
  } as unknown as Response;
}

export function mockFetch() {
  const fn = jest.fn<Promise<Response>, [string, RequestInit?]>();
  global.fetch = fn as unknown as typeof fetch;
  return fn;
}

/** Calls of a mocked fetch, as URLs. */
export const fetchedUrls = (fn: jest.Mock) => fn.mock.calls.map((call) => String(call[0]));

export function abortError() {
  const error = new Error('Aborted');
  error.name = 'AbortError';
  return error;
}

/** A fetch that never resolves until its signal aborts — for timeout/cancellation tests. */
export function hangingFetch(_url: string, init?: RequestInit): Promise<Response> {
  return new Promise((_, reject) => {
    if (init?.signal?.aborted) return reject(abortError());
    init?.signal?.addEventListener('abort', () => reject(abortError()));
  });
}
