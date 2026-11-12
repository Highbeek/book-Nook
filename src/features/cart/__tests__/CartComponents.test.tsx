import { render, screen, userEvent } from '@testing-library/react-native';
import { View } from 'react-native';

import { makeBook } from '@/test-utils/fixtures';

import { CartItemRow } from '../CartItemRow';
import { CartSummary } from '../CartSummary';
import { useCartStore } from '../cartStore';

const book = makeBook({ id: 'A', title: 'Purple Hibiscus', price: 3_000_00 });

function CartUnderTest() {
  const lines = useCartStore((s) => s.lines);
  return (
    <View>
      {lines.map((line) => (
        <CartItemRow key={line.book.id} line={line} />
      ))}
      <CartSummary />
    </View>
  );
}

beforeEach(() => useCartStore.setState({ lines: [] }));

describe('cart add/remove components', () => {
  it('shows the line and a live total for an added book', async () => {
    useCartStore.getState().addItem(book);
    await render(<CartUnderTest />);

    expect(screen.getByText('Purple Hibiscus')).toBeOnTheScreen();
    expect(screen.getByTestId('quantity')).toHaveTextContent('1');
    expect(screen.getByTestId('cart-total')).toHaveTextContent('₦3,000');
    expect(screen.getByText('Subtotal (1 item)')).toBeOnTheScreen();
  });

  it('increments quantity and updates line total and cart total', async () => {
    const user = userEvent.setup();
    useCartStore.getState().addItem(book);
    await render(<CartUnderTest />);

    await user.press(screen.getByRole('button', { name: 'Increase quantity of Purple Hibiscus' }));
    await user.press(screen.getByRole('button', { name: 'Increase quantity of Purple Hibiscus' }));

    expect(screen.getByTestId('quantity')).toHaveTextContent('3');
    expect(screen.getByTestId('line-total-A')).toHaveTextContent('₦9,000');
    expect(screen.getByTestId('cart-total')).toHaveTextContent('₦9,000');
    expect(screen.getByText('Subtotal (3 items)')).toBeOnTheScreen();
  });

  it('decrements, and removes the line when quantity reaches 0', async () => {
    const user = userEvent.setup();
    useCartStore.getState().addItem(book, 2);
    await render(<CartUnderTest />);

    await user.press(screen.getByRole('button', { name: 'Decrease quantity of Purple Hibiscus' }));
    expect(screen.getByTestId('quantity')).toHaveTextContent('1');

    await user.press(screen.getByRole('button', { name: 'Remove Purple Hibiscus' }));
    expect(screen.queryByText('Purple Hibiscus')).not.toBeOnTheScreen();
    expect(screen.getByTestId('cart-total')).toHaveTextContent('₦0');
  });

  it('removes a line with the Remove action, keeping the others', async () => {
    const user = userEvent.setup();
    const other = makeBook({ id: 'B', title: 'Half of a Yellow Sun', price: 4_000_00 });
    useCartStore.getState().addItem(book);
    useCartStore.getState().addItem(other);
    await render(<CartUnderTest />);

    await user.press(screen.getByRole('button', { name: 'Remove Purple Hibiscus from cart' }));

    expect(screen.queryByText('Purple Hibiscus')).not.toBeOnTheScreen();
    expect(screen.getByText('Half of a Yellow Sun')).toBeOnTheScreen();
    expect(screen.getByTestId('cart-total')).toHaveTextContent('₦4,000');
  });
});
