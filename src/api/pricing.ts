export const CURRENCY = 'NGN';
export const MIN_PRICE = 2_500_00;
export const MAX_PRICE = 15_000_00;
const STEP = 50_00;

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
