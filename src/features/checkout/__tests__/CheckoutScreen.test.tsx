import { render, screen, userEvent, waitFor } from '@testing-library/react-native';

import { useCartStore } from '@/features/cart/cartStore';
import { fillValidCheckoutForm } from '@/test-utils/checkout';
import { makeBook } from '@/test-utils/fixtures';

import { CheckoutScreen } from '../CheckoutScreen';
import { PaymentError } from '../paymentService';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace }) }));

beforeEach(() => {
  mockReplace.mockReset();
  useCartStore.setState({ lines: [] });
  useCartStore.getState().addItem(makeBook({ id: 'A', price: 2_500_00 }), 3);
});

describe('<CheckoutScreen />', () => {
  it('charges the live cart total', async () => {
    await render(<CheckoutScreen pay={jest.fn()} />);
    expect(screen.getByTestId('checkout-total')).toHaveTextContent('₦7,500');
    expect(screen.getByText('Order total · 3 items')).toBeOnTheScreen();
  });

  it('on success: clears the cart and replaces the screen with the confirmation', async () => {
    const user = userEvent.setup();
    const pay = jest.fn().mockResolvedValue({
      reference: 'BN_123',
      amount: 7_500_00,
      last4: '4242',
      paidAt: '2026-11-12T10:00:00.000Z',
    });
    await render(<CheckoutScreen pay={pay} />);
    await fillValidCheckoutForm(user);

    await user.press(screen.getByRole('button', { name: 'Pay ₦7,500' }));

    await waitFor(() => expect(useCartStore.getState().lines).toEqual([]));
    expect(pay).toHaveBeenCalledWith(expect.objectContaining({ amount: 7_500_00 }));
    expect(mockReplace).toHaveBeenCalledWith({
      pathname: '/order-confirmation',
      params: { reference: 'BN_123', amount: '750000', last4: '4242' },
    });
  });

  it('on decline: keeps the cart and stays on checkout', async () => {
    const user = userEvent.setup();
    const pay = jest.fn().mockRejectedValue(new PaymentError('Your card was declined.'));
    await render(<CheckoutScreen pay={pay} />);
    await fillValidCheckoutForm(user);

    await user.press(screen.getByRole('button', { name: 'Pay ₦7,500' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Your card was declined.');
    expect(useCartStore.getState().lines).toHaveLength(1);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('shows an empty state instead of a form when the cart is empty', async () => {
    useCartStore.setState({ lines: [] });
    await render(<CheckoutScreen pay={jest.fn()} />);
    expect(screen.getByText('Nothing to check out')).toBeOnTheScreen();
    expect(screen.queryByLabelText('Card number')).not.toBeOnTheScreen();
  });
});
