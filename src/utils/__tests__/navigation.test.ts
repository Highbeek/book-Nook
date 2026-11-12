import { resetStackTo } from '../navigation';

function makeNavigation() {
  const state = {
    key: 'stack-1',
    index: 2,
    routeNames: ['index', 'cart', 'checkout'],
    routes: [
      { key: 'index-1', name: 'index' },
      { key: 'cart-1', name: 'cart' },
      { key: 'checkout-1', name: 'checkout' },
    ],
    routeKeySeq: 3,
    stale: false as const,
    type: 'stack' as const,
  };
  return { getState: () => state, reset: jest.fn() };
}

describe('resetStackTo', () => {
  it('sends a complete state with a single, key-less route so the router mints a fresh screen', () => {
    const navigation = makeNavigation();

    resetStackTo(navigation as never, 'index');

    expect(navigation.reset).toHaveBeenCalledWith({
      key: 'stack-1',
      index: 0,
      routeNames: ['index', 'cart', 'checkout'],
      routes: [{ name: 'index' }],
      routeKeySeq: 3,
      stale: false,
      type: 'stack',
    });
  });
});
