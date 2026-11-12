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
    ...overrides,
  };
}
