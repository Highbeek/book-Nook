import { ApiError, errorMessage, fetchJson, isAbortError } from '../client';
import { hangingFetch, mockFetch, mockResponse } from '@/test-utils/fetch';

describe('fetchJson', () => {
  afterEach(() => jest.useRealTimers());

  it('returns parsed JSON on success', async () => {
    mockFetch().mockResolvedValue(mockResponse({ hello: 'world' }));
    await expect(fetchJson('https://x.test')).resolves.toEqual({ hello: 'world' });
  });

  it('turns non-2xx responses into an http ApiError with the status', async () => {
    mockFetch().mockResolvedValue(mockResponse({}, { status: 404 }));
    await expect(fetchJson('https://x.test')).rejects.toMatchObject({
      name: 'ApiError',
      kind: 'http',
      status: 404,
    });
  });

  it('gives a friendly message for server errors', async () => {
    mockFetch().mockResolvedValue(mockResponse({}, { status: 503 }));
    await expect(fetchJson('https://x.test')).rejects.toThrow(/having trouble/);
  });

  it('turns network failures into a network ApiError', async () => {
    mockFetch().mockRejectedValue(new TypeError('Network request failed'));
    await expect(fetchJson('https://x.test')).rejects.toMatchObject({ kind: 'network' });
  });

  it('turns malformed bodies into a parse ApiError', async () => {
    mockFetch().mockResolvedValue(mockResponse(null, { invalidJson: true }));
    await expect(fetchJson('https://x.test')).rejects.toMatchObject({ kind: 'parse' });
  });

  it('times out a hung request instead of waiting forever', async () => {
    jest.useFakeTimers();
    mockFetch().mockImplementation(hangingFetch);
    const promise = fetchJson('https://x.test', { timeoutMs: 1000 });
    jest.advanceTimersByTime(1000);
    await expect(promise).rejects.toMatchObject({ kind: 'timeout' });
  });

  it('passes caller cancellation through as an AbortError', async () => {
    mockFetch().mockImplementation(hangingFetch);
    const controller = new AbortController();
    const promise = fetchJson('https://x.test', { signal: controller.signal });
    controller.abort();
    const error = await promise.catch((e: unknown) => e);
    expect(isAbortError(error)).toBe(true);
    expect(error).not.toBeInstanceOf(ApiError);
  });

  it('does not even start when the signal is already aborted', async () => {
    const fetchFn = mockFetch().mockImplementation(hangingFetch);
    const controller = new AbortController();
    controller.abort();
    const error = await fetchJson('https://x.test', { signal: controller.signal }).catch(
      (e: unknown) => e,
    );
    expect(isAbortError(error)).toBe(true);
    expect(fetchFn).not.toHaveBeenCalled();
  });
});

describe('errorMessage', () => {
  it('uses ApiError messages and hides unknown errors', () => {
    expect(errorMessage(new ApiError('Nope', 'http', 400))).toBe('Nope');
    expect(errorMessage(new Error('internal stack detail'))).toBe(
      'Something went wrong. Please try again.',
    );
  });
});
