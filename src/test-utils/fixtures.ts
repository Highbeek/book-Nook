import type { BookDetail, BookSummary } from '@/api/types';

export function makeBook(overrides: Partial<BookSummary> = {}): BookSummary {
  return {
    id: 'OL1W',
    title: 'Things Fall Apart',
    authors: ['Chinua Achebe'],
    coverId: null,
    firstPublishYear: 1958,
    price: 5_000_00,
    ...overrides,
  };
}

export function makeBookDetail(overrides: Partial<BookDetail> = {}): BookDetail {
  return {
    ...makeBook(),
    description: 'Okonkwo, a proud Igbo warrior…',
    subjects: ['Nigeria', 'Fiction'],
    rating: { average: 4.2, count: 120, distribution: { 1: 5, 2: 5, 3: 10, 4: 30, 5: 70 } },
    ...overrides,
  };
}
