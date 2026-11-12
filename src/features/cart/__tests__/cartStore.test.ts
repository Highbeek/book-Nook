import { makeBook } from '@/test-utils/fixtures';

import {
  MAX_QUANTITY,
  selectItemCount,
  selectQuantity,
  selectTotal,
  useCartStore,
} from '../cartStore';

const bookA = makeBook({ id: 'A', price: 2_500_00 });
const bookB = makeBook({ id: 'B', price: 10_000_00 });

const cart = () => useCartStore.getState();
const total = () => selectTotal(cart());
const count = () => selectItemCount(cart());

beforeEach(() => useCartStore.setState({ lines: [] }));

describe('cart store', () => {
  it('starts empty with a zero total', () => {
    expect(cart().lines).toEqual([]);
    expect(total()).toBe(0);
    expect(count()).toBe(0);
  });

  it('adds a new book as a line with quantity 1', () => {
    cart().addItem(bookA);
    expect(cart().lines).toHaveLength(1);
    expect(selectQuantity('A')(cart())).toBe(1);
    expect(total()).toBe(2_500_00);
  });

  it('adding the same book twice increments one line instead of duplicating it', () => {
    cart().addItem(bookA);
    cart().addItem(bookA);
    expect(cart().lines).toHaveLength(1);
    expect(selectQuantity('A')(cart())).toBe(2);
    expect(total()).toBe(5_000_00);
  });

  it('keeps lines in the order books were first added', () => {
    cart().addItem(bookA);
    cart().addItem(bookB);
    cart().addItem(bookA);
    expect(cart().lines.map((l) => l.book.id)).toEqual(['A', 'B']);
  });

  it('computes the total across lines and quantities', () => {
    cart().addItem(bookA, 3); // 7,500
    cart().addItem(bookB, 2); // 20,000
    expect(total()).toBe(27_500_00);
    expect(count()).toBe(5);
  });

  it('removes a line', () => {
    cart().addItem(bookA);
    cart().addItem(bookB);
    cart().removeItem('A');
    expect(cart().lines.map((l) => l.book.id)).toEqual(['B']);
    expect(total()).toBe(10_000_00);
  });

  it('ignores removing a book that is not in the cart', () => {
    cart().addItem(bookA);
    cart().removeItem('nope');
    expect(cart().lines).toHaveLength(1);
  });

  it('sets an exact quantity', () => {
    cart().addItem(bookA);
    cart().setQuantity('A', 4);
    expect(selectQuantity('A')(cart())).toBe(4);
    expect(total()).toBe(10_000_00);
  });

  it('removes the line when quantity is set to 0 or below — never a zero/negative line', () => {
    cart().addItem(bookA);
    cart().addItem(bookB);
    cart().setQuantity('A', 0);
    cart().setQuantity('B', -3);
    expect(cart().lines).toEqual([]);
    expect(total()).toBe(0);
  });

  it('decrementing from 1 removes the line', () => {
    cart().addItem(bookA);
    cart().decrement('A');
    expect(cart().lines).toEqual([]);
  });

  it('increments and decrements', () => {
    cart().addItem(bookA);
    cart().increment('A');
    cart().increment('A');
    cart().decrement('A');
    expect(selectQuantity('A')(cart())).toBe(2);
  });

  it('clamps quantities to MAX_QUANTITY and floors fractions', () => {
    cart().addItem(bookA, MAX_QUANTITY);
    cart().increment('A');
    cart().addItem(bookA, 5);
    expect(selectQuantity('A')(cart())).toBe(MAX_QUANTITY);
    cart().setQuantity('A', 2.9);
    expect(selectQuantity('A')(cart())).toBe(2);
  });

  it('ignores invalid add quantities', () => {
    cart().addItem(bookA, 0);
    cart().addItem(bookA, NaN);
    expect(cart().lines).toEqual([]);
  });

  it('stores only the fields the cart needs', () => {
    cart().addItem({ ...bookA, description: 'long text' } as typeof bookA);
    expect(Object.keys(cart().lines[0].book).sort()).toEqual(
      ['authors', 'coverId', 'id', 'price', 'title'].sort(),
    );
  });

  it('clears everything', () => {
    cart().addItem(bookA);
    cart().addItem(bookB);
    cart().clear();
    expect(cart().lines).toEqual([]);
    expect(total()).toBe(0);
  });
});
