export type ApiErrorKind = 'http' | 'network' | 'timeout' | 'parse';

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;

  constructor(message: string, kind: ApiErrorKind, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
  }
}

export const DEFAULT_TIMEOUT_MS = 15_000;

export interface RequestOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
}

export function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

export function createAbortError(): Error {
  const error = new Error('The request was aborted.');
  error.name = 'AbortError';
  return error;
}

/**
 * fetch with a timeout and typed, user-presentable errors. Caller aborts are rethrown as
 * AbortError so callers can ignore them.
 */
export async function fetchJson<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const { signal, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
  if (signal?.aborted) throw createAbortError();

  const controller = new AbortController();
  let timedOut = false;

  const onCallerAbort = () => controller.abort();
  signal?.addEventListener('abort', onCallerAbort);

  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    let response: Response;
    try {
      response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
    } catch (error) {
      if (timedOut) {
        throw new ApiError('The request took too long. Please try again.', 'timeout');
      }
      if (isAbortError(error)) throw error;
      throw new ApiError('Network error. Check your connection and try again.', 'network');
    }

    if (!response.ok) {
      throw new ApiError(
        response.status >= 500
          ? 'The book service is having trouble right now. Please try again shortly.'
          : `Request failed (${response.status}).`,
        'http',
        response.status,
      );
    }

    try {
      return (await response.json()) as T;
    } catch (error) {
      if (timedOut) {
        throw new ApiError('The request took too long. Please try again.', 'timeout');
      }
      if (isAbortError(error)) throw error;
      throw new ApiError('Received an unexpected response from the server.', 'parse');
    }
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onCallerAbort);
  }
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return 'Something went wrong. Please try again.';
}
