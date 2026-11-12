export interface BookSummary {
  id: string;
  title: string;
  authors: string[];
  coverId: number | null;
  firstPublishYear: number | null;

  price: number;
}

export type StarValue = 1 | 2 | 3 | 4 | 5;

export interface BookRating {
  average: number;
  count: number;

  distribution: Record<StarValue, number>;
}

export interface BookDetail extends BookSummary {
  description: string | null;
  subjects: string[];

  rating: BookRating | null;
}

export interface BooksPage {
  items: BookSummary[];
  page: number;
  total: number;
  hasMore: boolean;
}

export interface OLSearchDoc {
  key: string;
  title?: string;
  author_name?: string[];
  cover_i?: number;
  first_publish_year?: number;
}

export interface OLSearchResponse {
  numFound: number;
  start: number;
  docs: OLSearchDoc[];
}

export interface OLSubjectWork {
  key: string;
  title?: string;
  cover_id?: number | null;
  first_publish_year?: number | null;
  authors?: { key: string; name: string }[];
}

export interface OLSubjectResponse {
  work_count: number;
  works: OLSubjectWork[];
}

export interface OLWork {
  key: string;
  title?: string;
  description?: string | { type?: string; value: string };
  subjects?: string[];
  covers?: number[];
  first_publish_date?: string;
  authors?: { author?: { key: string } }[];

  type?: { key: string };
  location?: string;
}

export interface OLAuthor {
  name?: string;
  personal_name?: string;
}

export interface OLRatings {
  summary?: { average?: number | null; count?: number };
  counts?: Partial<Record<'1' | '2' | '3' | '4' | '5', number>>;
}
