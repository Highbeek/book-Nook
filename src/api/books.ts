import { ApiError, createAbortError, fetchJson } from './client';
import { priceFor } from './pricing';
import type {
  BookDetail,
  BookSummary,
  BooksPage,
  OLAuthor,
  OLSearchDoc,
  OLSearchResponse,
  OLSubjectResponse,
  OLSubjectWork,
  OLWork,
} from './types';

export const API_BASE = 'https://openlibrary.org';
export const COVERS_BASE = 'https://covers.openlibrary.org';
export const DEFAULT_PAGE_SIZE = 20;
/** Browse feed shown when there is no search query. */
export const BROWSE_SUBJECT = 'fiction';

const SEARCH_FIELDS = 'key,title,author_name,cover_i,first_publish_year';
const MAX_AUTHORS_FETCHED = 3;

export type CoverSize = 'S' | 'M' | 'L';

export function coverUrl(coverId: number | null, size: CoverSize = 'M'): string | null {
  return coverId ? `${COVERS_BASE}/b/id/${coverId}-${size}.jpg` : null;
}

/** "/works/OL45804W" -> "OL45804W" */
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
  /** Free-text search. Empty/whitespace means "browse". */
  query?: string;
  /** 1-based page number. */
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

/** Fetches one page of books — search results when `query` is set, otherwise the browse feed. */
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

  // A short page also means we're at the end, even if `total` over-reports.
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

  // Author names are nice-to-have: one failing lookup must not fail the whole screen.
  const results = await Promise.allSettled(
    keys.map((key) => fetchJson<OLAuthor>(`${API_BASE}${key}.json`, { signal })),
  );
  if (signal?.aborted) throw createAbortError();
  return results
    .map((r) => (r.status === 'fulfilled' ? (r.value.name ?? r.value.personal_name) : undefined))
    .filter((name): name is string => Boolean(name));
}

/** Fetches full details for one work, following a single Open Library redirect if needed. */
export async function getBookById(id: string, signal?: AbortSignal): Promise<BookDetail> {
  let work = await fetchJson<OLWork>(`${API_BASE}/works/${encodeURIComponent(id)}.json`, {
    signal,
  });
  if (work.type?.key === '/type/redirect' && work.location) {
    work = await fetchJson<OLWork>(`${API_BASE}${work.location}.json`, { signal });
  }
  if (!work.key || work.type?.key === '/type/redirect') {
    throw new ApiError('This book could not be found.', 'http', 404);
  }

  const authors = await fetchAuthorNames(work, signal);
  // Keep the requested ID (not a redirect target) so the price matches the list row.
  const summary = makeSummary(
    id,
    work.title,
    authors,
    work.covers?.find((c) => c > 0),
    yearFrom(work.first_publish_date),
  );

  return {
    ...summary,
    description: descriptionText(work.description),
    subjects: (work.subjects ?? []).slice(0, 8),
  };
}
