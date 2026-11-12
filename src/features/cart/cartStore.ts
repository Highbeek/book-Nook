import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { BookSummary } from '@/api/types';

export const MAX_QUANTITY = 99;

/** The slice of a book the cart needs, so persisted carts stay small and stable. */
export type CartBook = Pick<BookSummary, 'id' | 'title' | 'authors' | 'coverId' | 'price'>;

export interface CartLine {
  book: CartBook;
  quantity: number;
}

export interface CartState {
  /** Ordered by when each book was first added. */
  lines: CartLine[];
  addItem: (book: CartBook, quantity?: number) => void;
  removeItem: (bookId: string) => void;
  /** Sets an exact quantity. 0 or less removes the line; values are clamped to MAX_QUANTITY. */
  setQuantity: (bookId: string, quantity: number) => void;
  increment: (bookId: string) => void;
  decrement: (bookId: string) => void;
  clear: () => void;
}

function clampQuantity(quantity: number): number {
  if (!Number.isFinite(quantity)) return 0;
  return Math.min(MAX_QUANTITY, Math.max(0, Math.floor(quantity)));
}

function toCartBook({ id, title, authors, coverId, price }: CartBook): CartBook {
  return { id, title, authors, coverId, price };
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],

      addItem: (book, quantity = 1) => {
        const qty = clampQuantity(quantity);
        if (qty === 0) return;
        set(({ lines }) => {
          const existing = lines.find((l) => l.book.id === book.id);
          if (existing) {
            return {
              lines: lines.map((l) =>
                l.book.id === book.id ? { ...l, quantity: clampQuantity(l.quantity + qty) } : l,
              ),
            };
          }
          return { lines: [...lines, { book: toCartBook(book), quantity: qty }] };
        });
      },

      removeItem: (bookId) =>
        set(({ lines }) => ({ lines: lines.filter((l) => l.book.id !== bookId) })),

      setQuantity: (bookId, quantity) => {
        const qty = clampQuantity(quantity);
        if (qty === 0) {
          get().removeItem(bookId);
          return;
        }
        set(({ lines }) => ({
          lines: lines.map((l) => (l.book.id === bookId ? { ...l, quantity: qty } : l)),
        }));
      },

      increment: (bookId) => {
        const line = get().lines.find((l) => l.book.id === bookId);
        if (line) get().setQuantity(bookId, line.quantity + 1);
      },

      decrement: (bookId) => {
        const line = get().lines.find((l) => l.book.id === bookId);
        if (line) get().setQuantity(bookId, line.quantity - 1);
      },

      clear: () => set({ lines: [] }),
    }),
    {
      name: 'book-nook/cart',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ lines }) => ({ lines }),
    },
  ),
);

// ---- Selectors (return primitives so subscribers only re-render when the value changes) ----

/** Total in minor units. Integer math, so no floating-point drift. */
export const selectTotal = (state: Pick<CartState, 'lines'>): number =>
  state.lines.reduce((sum, l) => sum + l.book.price * l.quantity, 0);

/** Number of copies across all lines (what the cart badge shows). */
export const selectItemCount = (state: Pick<CartState, 'lines'>): number =>
  state.lines.reduce((sum, l) => sum + l.quantity, 0);

export const selectQuantity =
  (bookId: string) =>
  (state: Pick<CartState, 'lines'>): number =>
    state.lines.find((l) => l.book.id === bookId)?.quantity ?? 0;
