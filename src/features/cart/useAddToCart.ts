import { useCallback } from 'react';

import { useFlyToCart } from '@/animation/FlyToCart';
import type { ViewRef } from '@/utils/refs';

import { useCartStore, type CartBook } from './cartStore';

/**
 * Adds a book to the cart and launches the fly-to-cart animation from `source`.
 * The store updates immediately; the animation is purely decorative and never gates state.
 */
export function useAddToCart() {
  const addItem = useCartStore((s) => s.addItem);
  const fly = useFlyToCart();

  return useCallback(
    (book: CartBook, source: ViewRef | null = null) => {
      addItem(book);
      fly(source, { coverId: book.coverId, title: book.title });
    },
    [addItem, fly],
  );
}
