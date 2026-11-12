import { env } from '@/config/env';

import { createCache } from './cache';
import { ApiError, createAbortError, fetchJson, isAbortError } from './client';
import { priceFor } from './pricing';
import type {
  BookDetail,
  BookRating,
  BookSummary,
  BooksPage,
  OLAuthor,
  OLRatings,
  OLSearchDoc,
  OLSearchResponse,
  OLSubjectResponse,
  OLSubjectWork,
  OLWork,
} from './types';

export const API_BASE = env.apiUrl;
export const COVERS_BASE = env.coversUrl;
export const DEFAULT_PAGE_SIZE = 20;
export const BROWSE_SUBJECT = 'fiction';

const SEARCH_FIELDS = 'key,title,author_name,cover_i,first_publish_year';
const MAX_AUTHORS_FETCHED = 3;

export type CoverSize = 'S' | 'M' | 'L';

export function coverUrl(coverId: number | null, size: CoverSize = 'M'): string | null {
  return coverId ? `${COVERS_BASE}/b/id/${coverId}-${size}.jpg` : null;
}

export function workIdFromKey(key: string): string {
  return key.replace(/^\/works\//, '');
}

function makeSummary(
  id: string,
  title: string | undefined,
  authors: string[],
  coverId: number | null | undefined,
  year: number | null | undefined,
): BookSummary {
  return {
    id,
    title: title?.trim() || 'Untitled',
    authors,
    coverId: coverId ?? null,
    firstPublishYear: year ?? null,
    price: priceFor(id),
  };
}

export function mapSearchDoc(doc: OLSearchDoc): BookSummary {
  return makeSummary(
    workIdFromKey(doc.key),
    doc.title,
    doc.author_name ?? [],
    doc.cover_i,
    doc.first_publish_year,
  );
}

export function mapSubjectWork(work: OLSubjectWork): BookSummary {
  return makeSummary(
    workIdFromKey(work.key),
    work.title,
    (work.authors ?? []).map((a) => a.name),
    work.cover_id,
    work.first_publish_year,
  );
}

export interface GetBooksParams {
  query?: string;
  page?: number;
  limit?: number;
  signal?: AbortSignal;
}

export function buildBooksUrl({
  query = '',
  page = 1,
  limit = DEFAULT_PAGE_SIZE,
}: Omit<GetBooksParams, 'signal'>): string {
  const q = query.trim();
  if (q) {
    const params = new URLSearchParams({
      q,
      page: String(page),
      limit: String(limit),
      fields: SEARCH_FIELDS,
    });
    return `${API_BASE}/search.json?${params.toString()}`;
  }
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String((page - 1) * limit),
  });
  return `${API_BASE}/subjects/${BROWSE_SUBJECT}.json?${params.toString()}`;
}

export async function getBooks(params: GetBooksParams = {}): Promise<BooksPage> {
  const { query = '', page = 1, limit = DEFAULT_PAGE_SIZE, signal } = params;
  const url = buildBooksUrl({ query, page, limit });

  let items: BookSummary[];
  let total: number;
  if (query.trim()) {
    const data = await fetchJson<OLSearchResponse>(url, { signal });
    items = (data.docs ?? []).map(mapSearchDoc);
    total = data.numFound ?? 0;
  } else {
    const data = await fetchJson<OLSubjectResponse>(url, { signal });
    items = (data.works ?? []).map(mapSubjectWork);
    total = data.work_count ?? 0;
  }

  const hasMore = items.length === limit && page * limit < total;
  return { items, page, total, hasMore };
}

function descriptionText(description: OLWork['description']): string | null {
  if (!description) return null;
  const text = typeof description === 'string' ? description : description.value;
  return text?.trim() || null;
}

function yearFrom(date: string | undefined): number | null {
  const match = date?.match(/\d{4}/);
  return match ? Number(match[0]) : null;
}

async function fetchAuthorNames(work: OLWork, signal?: AbortSignal): Promise<string[]> {
  const keys = (work.authors ?? [])
    .map((a) => a.author?.key)
    .filter((key): key is string => Boolean(key))
    .slice(0, MAX_AUTHORS_FETCHED);

  const results = await Promise.allSettled(
    keys.map((key) => fetchJson<OLAuthor>(`${API_BASE}${key}.json`, { signal })),
  );
  if (signal?.aborted) throw createAbortError();
  return results
    .map((r) => (r.status === 'fulfilled' ? (r.value.name ?? r.value.personal_name) : undefined))
    .filter((name): name is string => Boolean(name));
}

const STAR_VALUES = [1, 2, 3, 4, 5] as const;

export function mapRatings(data: OLRatings): BookRating | null {
  const average = data.summary?.average;
  const count = data.summary?.count ?? 0;
  if (!count || typeof average !== 'number' || !Number.isFinite(average)) return null;
  const distribution = {} as BookRating['distribution'];
  for (const star of STAR_VALUES) distribution[star] = data.counts?.[star] ?? 0;
  return { average, count, distribution };
}

async function fetchRating(workKey: string, signal?: AbortSignal): Promise<BookRating | null> {
  try {
    return mapRatings(await fetchJson<OLRatings>(`${API_BASE}${workKey}/ratings.json`, { signal }));
  } catch (error) {
    if (isAbortError(error)) throw error;
    return null;
  }
}

const bookCache = createCache<BookDetail>({ ttlMs: 10 * 60_000, maxEntries: 50 });

export function getCachedBook(id: string): BookDetail | undefined {
  return bookCache.get(id);
}

export function clearBookCache() {
  bookCache.clear();
}

export async function getBookById(id: string, signal?: AbortSignal): Promise<BookDetail> {
  const cached = bookCache.get(id);
  if (cached) return cached;

  let work = await fetchJson<OLWork>(`${API_BASE}/works/${encodeURIComponent(id)}.json`, {
    signal,
  });
  if (work.type?.key === '/type/redirect' && work.location) {
    work = await fetchJson<OLWork>(`${API_BASE}${work.location}.json`, { signal });
  }
  if (!work.key || work.type?.key === '/type/redirect') {
    throw new ApiError('This book could not be found.', 'http', 404);
  }

  const [authors, rating] = await Promise.all([
    fetchAuthorNames(work, signal),
    fetchRating(work.key, signal),
  ]);

  const summary = makeSummary(
    id,
    work.title,
    authors,
    work.covers?.find((c) => c > 0),
    yearFrom(work.first_publish_date),
  );

  const book: BookDetail = {
    ...summary,
    description: descriptionText(work.description),
    subjects: (work.subjects ?? []).slice(0, 8),
    rating,
  };
  bookCache.set(id, book);
  return book;
}
