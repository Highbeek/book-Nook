/**
 * Open Library has no prices, so each book gets a stable price derived from its ID.
 * All money is integer kobo to avoid floating-point drift.
 */
export const CURRENCY = 'NGN';
export const MIN_PRICE = 2_500_00; // ₦2,500
export const MAX_PRICE = 15_000_00; // ₦15,000
const STEP = 50_00; // ₦50

/** FNV-1a 32-bit hash. */
function hash(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function priceFor(bookId: string): number {
  const steps = (MAX_PRICE - MIN_PRICE) / STEP + 1;
  return MIN_PRICE + (hash(bookId) % steps) * STEP;
}
