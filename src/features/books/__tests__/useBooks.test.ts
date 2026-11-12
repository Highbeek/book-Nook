import { act, renderHook, waitFor } from '@testing-library/react-native';

import { getBooks } from '@/api/books';
import { ApiError } from '@/api/client';
import type { BooksPage } from '@/api/types';
import { deferred } from '@/test-utils/deferred';
import { makeBook } from '@/test-utils/fixtures';

import { useBooks } from '../useBooks';

jest.mock('@/api/books', () => ({
  ...jest.requireActual('@/api/books'),
  getBooks: jest.fn(),
}));
const mockGetBooks = jest.mocked(getBooks);

const page = (n: number, ids: string[], hasMore = true): BooksPage => ({
  items: ids.map((id) => makeBook({ id, title: `Book ${id}` })),
  page: n,
  total: 100,
  hasMore,
});

beforeEach(() => mockGetBooks.mockReset());

describe('useBooks', () => {
  it('loads the first page on mount', async () => {
    mockGetBooks.mockResolvedValue(page(1, ['a', 'b']));
    const { result } = await renderHook(() => useBooks('', 2));

    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.items.map((b) => b.id)).toEqual(['a', 'b']);
    expect(mockGetBooks).toHaveBeenCalledWith(
      expect.objectContaining({ query: '', page: 1, limit: 2 }),
    );
  });

  it('appends the next page on loadMore', async () => {
    mockGetBooks.mockResolvedValueOnce(page(1, ['a', 'b']));
    mockGetBooks.mockResolvedValueOnce(page(2, ['c', 'd']));
    const { result } = await renderHook(() => useBooks('', 2));
    await waitFor(() => expect(result.current.status).toBe('ready'));

    await act(async () => result.current.loadMore());

    await waitFor(() => expect(result.current.items).toHaveLength(4));
    expect(result.current.page).toBe(2);
    expect(mockGetBooks).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }));
  });

  it('ignores loadMore while a page is already loading (no duplicate requests)', async () => {
    mockGetBooks.mockResolvedValueOnce(page(1, ['a']));
    const pending = deferred<BooksPage>();
    mockGetBooks.mockReturnValueOnce(pending.promise);
    const { result } = await renderHook(() => useBooks('', 1));
    await waitFor(() => expect(result.current.status).toBe('ready'));

    await act(async () => {
      result.current.loadMore();
      result.current.loadMore();
      result.current.loadMore();
    });
    expect(result.current.status).toBe('loadingMore');
    expect(mockGetBooks).toHaveBeenCalledTimes(2);

    await act(async () => pending.resolve(page(2, ['b'])));
    expect(result.current.items.map((b) => b.id)).toEqual(['a', 'b']);
  });

  it('does not request past the last page', async () => {
    mockGetBooks.mockResolvedValue(page(1, ['a'], false));
    const { result } = await renderHook(() => useBooks('', 1));
    await waitFor(() => expect(result.current.status).toBe('ready'));

    await act(async () => result.current.loadMore());
    expect(mockGetBooks).toHaveBeenCalledTimes(1);
  });

  it('de-duplicates books repeated across pages', async () => {
    mockGetBooks.mockResolvedValueOnce(page(1, ['a', 'b']));
    mockGetBooks.mockResolvedValueOnce(page(2, ['b', 'c']));
    const { result } = await renderHook(() => useBooks('', 2));
    await waitFor(() => expect(result.current.status).toBe('ready'));

    await act(async () => result.current.loadMore());
    await waitFor(() => expect(result.current.page).toBe(2));
    expect(result.current.items.map((b) => b.id)).toEqual(['a', 'b', 'c']);
  });

  it('resets to page 1 when the query changes, ignoring the stale response', async () => {
    const stale = deferred<BooksPage>();
    mockGetBooks.mockReturnValueOnce(stale.promise);
    mockGetBooks.mockResolvedValueOnce(page(1, ['dune']));

    const { result, rerender } = await renderHook(({ q }: { q: string }) => useBooks(q, 2), {
      initialProps: { q: '' },
    });
    await rerender({ q: 'dune' });
    await waitFor(() => expect(result.current.status).toBe('ready'));

    await act(async () => stale.resolve(page(1, ['old'])));
    expect(result.current.items.map((b) => b.id)).toEqual(['dune']);
    expect(mockGetBooks).toHaveBeenLastCalledWith(
      expect.objectContaining({ query: 'dune', page: 1 }),
    );
    expect(mockGetBooks.mock.calls[0][0]?.signal?.aborted).toBe(true);
  });

  it('surfaces an initial load error and recovers on retry', async () => {
    mockGetBooks.mockRejectedValueOnce(new ApiError('Network error.', 'network'));
    mockGetBooks.mockResolvedValueOnce(page(1, ['a']));
    const { result } = await renderHook(() => useBooks('', 1));

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBe('Network error.');

    await act(async () => result.current.retry());
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.items).toHaveLength(1);
  });

  it('keeps loaded rows when a later page fails, and retries that page', async () => {
    mockGetBooks.mockResolvedValueOnce(page(1, ['a']));
    mockGetBooks.mockRejectedValueOnce(new ApiError('Network error.', 'network'));
    mockGetBooks.mockResolvedValueOnce(page(2, ['b']));
    const { result } = await renderHook(() => useBooks('', 1));
    await waitFor(() => expect(result.current.status).toBe('ready'));

    await act(async () => result.current.loadMore());
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.items.map((b) => b.id)).toEqual(['a']);

    await act(async () => result.current.loadMore());
    expect(mockGetBooks).toHaveBeenCalledTimes(2);

    await act(async () => result.current.retry());
    await waitFor(() => expect(result.current.items).toHaveLength(2));
    expect(mockGetBooks).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }));
  });

  it('refresh replaces the list with a fresh first page', async () => {
    mockGetBooks.mockResolvedValueOnce(page(1, ['a']));
    mockGetBooks.mockResolvedValueOnce(page(2, ['b']));
    mockGetBooks.mockResolvedValueOnce(page(1, ['z']));
    const { result } = await renderHook(() => useBooks('', 1));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    await act(async () => result.current.loadMore());
    await waitFor(() => expect(result.current.items).toHaveLength(2));

    await act(async () => result.current.refresh());
    await waitFor(() => expect(result.current.items.map((b) => b.id)).toEqual(['z']));
  });

  it('aborts the in-flight request on unmount', async () => {
    mockGetBooks.mockReturnValue(new Promise(() => {}));
    const { unmount } = await renderHook(() => useBooks('', 1));
    await unmount();
    expect(mockGetBooks.mock.calls[0][0]?.signal?.aborted).toBe(true);
  });
});
