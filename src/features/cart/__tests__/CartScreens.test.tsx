import { act, render, screen, userEvent } from '@testing-library/react-native';

import { makeBook } from '@/test-utils/fixtures';

import { CartIcon } from '../CartIcon';
import { CartScreen } from '../CartScreen';
import { useCartStore } from '../cartStore';

const mockPush = jest.fn();
const mockDismissTo = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, dismissTo: mockDismissTo }),
}));

beforeEach(() => {
  mockPush.mockReset();
  mockDismissTo.mockReset();
  useCartStore.setState({ lines: [] });
});

describe('<CartIcon />', () => {
  it('shows the item count badge, updating live as the cart changes', async () => {
    await render(<CartIcon />);
    expect(screen.getByRole('button', { name: 'Cart, empty' })).toBeOnTheScreen();
    expect(screen.queryByTestId('cart-badge')).not.toBeOnTheScreen();

    await act(async () => useCartStore.getState().addItem(makeBook({ id: 'A' }), 2));
    expect(screen.getByTestId('cart-badge')).toHaveTextContent('2');
    expect(screen.getByRole('button', { name: 'Cart, 2 items' })).toBeOnTheScreen();
  });

  it('navigates to the cart', async () => {
    const user = userEvent.setup();
    await render(<CartIcon />);
    await user.press(screen.getByRole('button', { name: 'Cart, empty' }));
    expect(mockPush).toHaveBeenCalledWith('/cart');
  });
});

describe('<CartScreen />', () => {
  it('shows an empty state with a way back to browsing', async () => {
    const user = userEvent.setup();
    await render(<CartScreen />);
    expect(screen.getByText('Your cart is empty')).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: 'Browse books' }));
    expect(mockDismissTo).toHaveBeenCalledWith('/');
  });

  it('lists lines with the total and proceeds to checkout', async () => {
    const user = userEvent.setup();
    useCartStore.getState().addItem(makeBook({ id: 'A', title: 'Book A', price: 1_000_00 }), 2);
    useCartStore.getState().addItem(makeBook({ id: 'B', title: 'Book B', price: 3_000_00 }));
    await render(<CartScreen />);

    expect(screen.getByText('Book A')).toBeOnTheScreen();
    expect(screen.getByText('Book B')).toBeOnTheScreen();
    expect(screen.getByTestId('cart-total')).toHaveTextContent('₦5,000');

    await user.press(screen.getByRole('button', { name: 'Checkout' }));
    expect(mockPush).toHaveBeenCalledWith('/checkout');
  });

  it('switches to the empty state when the last line is removed', async () => {
    const user = userEvent.setup();
    useCartStore.getState().addItem(makeBook({ id: 'A', title: 'Book A' }));
    await render(<CartScreen />);

    await user.press(screen.getByRole('button', { name: 'Remove Book A from cart' }));

    expect(screen.getByText('Your cart is empty')).toBeOnTheScreen();
  });
});
