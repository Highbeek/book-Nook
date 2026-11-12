import {
  buildBooksUrl,
  coverUrl,
  getBookById,
  getBooks,
  mapSearchDoc,
  mapSubjectWork,
} from '../books';
import { priceFor } from '../pricing';
import { fetchedUrls, mockFetch, mockResponse } from '@/test-utils/fetch';

const searchResponse = {
  numFound: 45,
  start: 0,
  docs: [
    {
      key: '/works/OL893415W',
      title: 'Dune',
      author_name: ['Frank Herbert'],
      cover_i: 11481354,
      first_publish_year: 1965,
    },
    { key: '/works/OL1W' }, // sparse doc: everything optional
  ],
};

const subjectResponse = {
  work_count: 1000,
  works: [
    {
      key: '/works/OL166894W',
      title: 'Crime and Punishment',
      cover_id: 9411873,
      first_publish_year: 1866,
      authors: [{ key: '/authors/OL22242A', name: 'Fyodor Dostoevsky' }],
    },
  ],
};

describe('buildBooksUrl', () => {
  it('uses the subject browse feed with an offset when there is no query', () => {
    const url = new URL(buildBooksUrl({ page: 3, limit: 20 }));
    expect(url.pathname).toBe('/subjects/fiction.json');
    expect(url.searchParams.get('limit')).toBe('20');
    expect(url.searchParams.get('offset')).toBe('40');
  });

  it('treats a whitespace-only query as browse', () => {
    expect(buildBooksUrl({ query: '   ' })).toContain('/subjects/fiction.json');
  });

  it('uses search with page, limit, trimmed query and a narrow field list', () => {
    const url = new URL(buildBooksUrl({ query: '  dune ', page: 2, limit: 10 }));
    expect(url.pathname).toBe('/search.json');
    expect(url.searchParams.get('q')).toBe('dune');
    expect(url.searchParams.get('page')).toBe('2');
    expect(url.searchParams.get('limit')).toBe('10');
    expect(url.searchParams.get('fields')).toContain('cover_i');
  });

  it('URL-encodes queries', () => {
    expect(buildBooksUrl({ query: 'harry & potter' })).toContain('q=harry+%26+potter');
  });
});

describe('mappers', () => {
  it('maps a search doc to a BookSummary with a derived price', () => {
    expect(mapSearchDoc(searchResponse.docs[0])).toEqual({
      id: 'OL893415W',
      title: 'Dune',
      authors: ['Frank Herbert'],
      coverId: 11481354,
      firstPublishYear: 1965,
      price: priceFor('OL893415W'),
    });
  });

  it('fills safe defaults for sparse docs', () => {
    expect(mapSearchDoc({ key: '/works/OL1W' })).toMatchObject({
      id: 'OL1W',
      title: 'Untitled',
      authors: [],
      coverId: null,
      firstPublishYear: null,
    });
  });

  it('maps a subject work', () => {
    expect(mapSubjectWork(subjectResponse.works[0])).toMatchObject({
      id: 'OL166894W',
      authors: ['Fyodor Dostoevsky'],
      coverId: 9411873,
    });
  });
});

describe('coverUrl', () => {
  it('builds a sized cover URL, or null when there is no cover', () => {
    expect(coverUrl(123, 'L')).toBe('https://covers.openlibrary.org/b/id/123-L.jpg');
    expect(coverUrl(null)).toBeNull();
  });
});

describe('getBooks', () => {
  it('fetches and maps a search page', async () => {
    const fetchFn = mockFetch().mockResolvedValue(mockResponse(searchResponse));
    const page = await getBooks({ query: 'dune', page: 1, limit: 2 });

    expect(fetchedUrls(fetchFn)[0]).toContain('/search.json?q=dune');
    expect(page.items.map((b) => b.id)).toEqual(['OL893415W', 'OL1W']);
    expect(page.total).toBe(45);
    expect(page.hasMore).toBe(true);
  });

  it('fetches and maps the browse feed', async () => {
    mockFetch().mockResolvedValue(mockResponse(subjectResponse));
    const page = await getBooks({ page: 1, limit: 1 });
    expect(page.items[0].title).toBe('Crime and Punishment');
    expect(page.total).toBe(1000);
  });

  it('reports no more pages on the last page', async () => {
    mockFetch().mockResolvedValue(mockResponse({ ...searchResponse, numFound: 4 }));
    const page = await getBooks({ query: 'dune', page: 2, limit: 2 });
    expect(page.hasMore).toBe(false);
  });

  it('reports no more pages when a page comes back short', async () => {
    mockFetch().mockResolvedValue(mockResponse(searchResponse)); // 2 docs
    const page = await getBooks({ query: 'dune', page: 1, limit: 20 });
    expect(page.hasMore).toBe(false);
  });

  it('propagates API errors', async () => {
    mockFetch().mockResolvedValue(mockResponse({}, { status: 500 }));
    await expect(getBooks({ query: 'dune' })).rejects.toMatchObject({ kind: 'http', status: 500 });
  });

  it('forwards the abort signal to fetch', async () => {
    const fetchFn = mockFetch().mockResolvedValue(mockResponse(searchResponse));
    const controller = new AbortController();
    await getBooks({ query: 'dune', signal: controller.signal });
    const init = fetchFn.mock.calls[0][1];
    expect(init?.signal).toBeDefined();
  });
});

describe('getBookById', () => {
  const work = {
    key: '/works/OL893415W',
    title: 'Dune',
    description: { type: '/type/text', value: '  A desert planet.  ' },
    subjects: ['Science fiction', 'Deserts'],
    covers: [-1, 11481354],
    first_publish_date: 'August 1965',
    authors: [{ author: { key: '/authors/OL79034A' } }, { author: { key: '/authors/BAD' } }],
  };

  it('fetches the work and its authors, tolerating a failed author lookup', async () => {
    const fetchFn = mockFetch().mockImplementation(async (url: string) => {
      if (url.endsWith('/works/OL893415W.json')) return mockResponse(work);
      if (url.endsWith('/authors/OL79034A.json')) return mockResponse({ name: 'Frank Herbert' });
      return mockResponse({}, { status: 404 });
    });

    const book = await getBookById('OL893415W');

    expect(fetchedUrls(fetchFn)).toEqual([
      'https://openlibrary.org/works/OL893415W.json',
      'https://openlibrary.org/authors/OL79034A.json',
      'https://openlibrary.org/authors/BAD.json',
    ]);
    expect(book).toEqual({
      id: 'OL893415W',
      title: 'Dune',
      authors: ['Frank Herbert'],
      coverId: 11481354, // skips the invalid -1 cover
      firstPublishYear: 1965,
      price: priceFor('OL893415W'),
      description: 'A desert planet.',
      subjects: ['Science fiction', 'Deserts'],
    });
  });

  it('accepts a plain-string description', async () => {
    mockFetch().mockResolvedValue(mockResponse({ key: '/works/OL2W', description: 'Plain.' }));
    await expect(getBookById('OL2W')).resolves.toMatchObject({ description: 'Plain.' });
  });

  it('follows a redirect stub but keeps the requested id (so the price matches the list)', async () => {
    const fetchFn = mockFetch().mockImplementation(async (url: string) =>
      url.endsWith('/works/OLOLDW.json')
        ? mockResponse({
            key: '/works/OLOLDW',
            type: { key: '/type/redirect' },
            location: '/works/OLNEWW',
          })
        : mockResponse({ key: '/works/OLNEWW', title: 'Canonical' }),
    );
    const book = await getBookById('OLOLDW');
    expect(fetchedUrls(fetchFn)[1]).toBe('https://openlibrary.org/works/OLNEWW.json');
    expect(book).toMatchObject({ id: 'OLOLDW', title: 'Canonical', price: priceFor('OLOLDW') });
  });

  it('fails with a not-found error when the work fetch 404s', async () => {
    mockFetch().mockResolvedValue(mockResponse({}, { status: 404 }));
    await expect(getBookById('OLMISSINGW')).rejects.toMatchObject({ status: 404 });
  });
});
