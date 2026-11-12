import { createCache } from '../cache';

describe('createCache', () => {
  it('returns stored values until they expire', () => {
    let time = 0;
    const cache = createCache<string>({ ttlMs: 1000, maxEntries: 10, now: () => time });
    cache.set('a', 'A');

    time = 999;
    expect(cache.get('a')).toBe('A');
    time = 1000;
    expect(cache.get('a')).toBeUndefined();
  });

  it('evicts the least recently used entry when full', () => {
    const cache = createCache<number>({ ttlMs: 60_000, maxEntries: 2 });
    cache.set('a', 1);
    cache.set('b', 2);
    cache.get('a');
    cache.set('c', 3);

    expect(cache.get('a')).toBe(1);
    expect(cache.get('b')).toBeUndefined();
    expect(cache.get('c')).toBe(3);
  });

  it('can be cleared', () => {
    const cache = createCache<number>({ ttlMs: 60_000, maxEntries: 2 });
    cache.set('a', 1);
    cache.clear();
    expect(cache.get('a')).toBeUndefined();
  });
});
