export interface BookSummary {
  /** Open Library work ID, e.g. "OL45804W". */
  id: string;
  title: string;
  authors: string[];
  coverId: number | null;
  firstPublishYear: number | null;
  /** Price in minor units (kobo). */
  price: number;
}

export interface BookDetail extends BookSummary {
  description: string | null;
  subjects: string[];
}

export interface BooksPage {
  items: BookSummary[];
  page: number;
  total: number;
  hasMore: boolean;
}

// ---- Raw Open Library response shapes (only the fields we use) ----

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
  /** Merged works are left behind as redirect stubs pointing at the canonical work. */
  type?: { key: string };
  location?: string;
}

export interface OLAuthor {
  name?: string;
  personal_name?: string;
}
