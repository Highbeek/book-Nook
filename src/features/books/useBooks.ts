import { useCallback, useEffect, useReducer, useRef } from 'react';

import { DEFAULT_PAGE_SIZE, getBooks } from '@/api/books';
import { errorMessage, isAbortError } from '@/api/client';
import type { BookSummary } from '@/api/types';

type LoadMode = 'initial' | 'more' | 'refresh';

export type BooksStatus = 'loading' | 'loadingMore' | 'refreshing' | 'ready' | 'error';

export interface BooksState {
  items: BookSummary[];
  /** Last page successfully loaded (0 = none). */
  page: number;
  total: number;
  hasMore: boolean;
  status: BooksStatus;
  error: string | null;
}

type Action =
  | { type: 'start'; mode: LoadMode }
  | {
      type: 'success';
      mode: LoadMode;
      page: number;
      items: BookSummary[];
      total: number;
      hasMore: boolean;
    }
  | { type: 'failure'; error: string };

export const initialBooksState: BooksState = {
  items: [],
  page: 0,
  total: 0,
  hasMore: true,
  status: 'loading',
  error: null,
};

const startStatus: Record<LoadMode, BooksStatus> = {
  initial: 'loading',
  more: 'loadingMore',
  refresh: 'refreshing',
};

/** Open Library can repeat a work across pages, so drop IDs already loaded. */
function appendUnique(existing: BookSummary[], incoming: BookSummary[]): BookSummary[] {
  const seen = new Set(existing.map((b) => b.id));
  const next = existing.slice();
  for (const book of incoming) {
    if (!seen.has(book.id)) {
      seen.add(book.id);
      next.push(book);
    }
  }
  return next;
}

export function booksReducer(state: BooksState, action: Action): BooksState {
  switch (action.type) {
    case 'start':
      return {
        ...state,
        // Refresh keeps the old rows visible until the new page arrives.
        ...(action.mode === 'initial' ? { items: [], page: 0, total: 0, hasMore: true } : null),
        status: startStatus[action.mode],
        error: null,
      };
    case 'success': {
      const replace = action.mode !== 'more';
      return {
        items: replace ? appendUnique([], action.items) : appendUnique(state.items, action.items),
        page: action.page,
        total: action.total,
        hasMore: action.hasMore,
        status: 'ready',
        error: null,
      };
    }
    case 'failure':
      return { ...state, status: 'error', error: action.error };
  }
}

/**
 * Paginated feed for `query` (empty = browse). `loadMore` does nothing while a request is in
 * flight, at the end, or after an error, so `onEndReached` can't loop; `retry` recovers.
 */
export function useBooks(query: string, pageSize = DEFAULT_PAGE_SIZE) {
  const [state, dispatch] = useReducer(booksReducer, initialBooksState);
  const inFlight = useRef<AbortController | null>(null);

  const fetchPage = useCallback(
    async (page: number, mode: LoadMode) => {
      inFlight.current?.abort();
      const controller = new AbortController();
      inFlight.current = controller;
      dispatch({ type: 'start', mode });

      try {
        const result = await getBooks({ query, page, limit: pageSize, signal: controller.signal });
        if (controller.signal.aborted) return;
        dispatch({
          type: 'success',
          mode,
          page,
          items: result.items,
          total: result.total,
          hasMore: result.hasMore,
        });
      } catch (error) {
        if (controller.signal.aborted || isAbortError(error)) return;
        dispatch({ type: 'failure', error: errorMessage(error) });
      } finally {
        if (inFlight.current === controller) inFlight.current = null;
      }
    },
    [query, pageSize],
  );

  useEffect(() => {
    fetchPage(1, 'initial');
    return () => inFlight.current?.abort();
  }, [fetchPage]);

  const { page, hasMore, status, items } = state;

  const loadMore = useCallback(() => {
    if (inFlight.current || !hasMore || status !== 'ready') return;
    fetchPage(page + 1, 'more');
  }, [fetchPage, page, hasMore, status]);

  const refresh = useCallback(() => {
    fetchPage(1, 'refresh');
  }, [fetchPage]);

  const retry = useCallback(() => {
    if (items.length === 0) fetchPage(1, 'initial');
    else fetchPage(page + 1, 'more');
  }, [fetchPage, items.length, page]);

  return { ...state, loadMore, refresh, retry };
}
