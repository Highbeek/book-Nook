import { MAX_PRICE, MIN_PRICE, priceFor } from '../pricing';

describe('priceFor', () => {
  it('is deterministic for the same book', () => {
    expect(priceFor('OL45804W')).toBe(priceFor('OL45804W'));
  });

  it('always lands in range, on whole ₦50 steps, as integer kobo', () => {
    for (let i = 0; i < 2000; i++) {
      const price = priceFor(`OL${i}W`);
      expect(Number.isInteger(price)).toBe(true);
      expect(price).toBeGreaterThanOrEqual(MIN_PRICE);
      expect(price).toBeLessThanOrEqual(MAX_PRICE);
      expect(price % 50_00).toBe(0);
    }
  });

  it('spreads prices across books rather than collapsing to a few values', () => {
    const distinct = new Set(Array.from({ length: 200 }, (_, i) => priceFor(`OL${i}W`)));
    expect(distinct.size).toBeGreaterThan(100);
  });
});
