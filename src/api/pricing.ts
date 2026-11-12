/**
 * Open Library has no prices, so each book gets a deterministic price derived from its work ID.
 * The same book always costs the same, on every device and every launch.
 *
 * All money in the app is integer minor units (kobo) to avoid floating-point drift in totals.
 */
export const CURRENCY = 'NGN';
export const MIN_PRICE = 2_500_00; // ₦2,500
export const MAX_PRICE = 15_000_00; // ₦15,000
const STEP = 50_00; // prices land on ₦50 increments

/** FNV-1a 32-bit — tiny, fast, well distributed for short strings. */
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
