import { useCallback, useEffect, useState } from 'react';

import { getBookById } from '@/api/books';
import { errorMessage, isAbortError } from '@/api/client';
import type { BookDetail } from '@/api/types';

export type BookDetailsState =
  | { status: 'loading' }
  | { status: 'success'; book: BookDetail }
  | { status: 'error'; error: string };

type Settled = { key: string } & (
  { status: 'success'; book: BookDetail } | { status: 'error'; error: string }
);

export function useBookDetails(id: string | undefined) {
  const [attempt, setAttempt] = useState(0);
  const [settled, setSettled] = useState<Settled | null>(null);
  const key = `${id}:${attempt}`;

  useEffect(() => {
    if (!id) return;
    const requestKey = `${id}:${attempt}`;
    const controller = new AbortController();

    getBookById(id, controller.signal)
      .then((book) => {
        if (!controller.signal.aborted) setSettled({ key: requestKey, status: 'success', book });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted || isAbortError(error)) return;
        setSettled({ key: requestKey, status: 'error', error: errorMessage(error) });
      });

    return () => controller.abort();
  }, [id, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  let state: BookDetailsState;
  if (!id) state = { status: 'error', error: 'No book was selected.' };
  else if (!settled || settled.key !== key) state = { status: 'loading' };
  else if (settled.status === 'success') state = { status: 'success', book: settled.book };
  else state = { status: 'error', error: settled.error };

  return { ...state, retry };
}
