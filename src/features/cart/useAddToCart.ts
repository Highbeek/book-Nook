import { useCallback } from 'react';

import { useFlyToCart } from '@/animation/FlyToCart';
import type { ViewRef } from '@/utils/refs';

import { useCartStore, type CartBook } from './cartStore';

/** Updates the cart immediately; the fly-to-cart animation is decoration only. */
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
