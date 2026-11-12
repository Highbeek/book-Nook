import { render, screen, userEvent } from '@testing-library/react-native';

import { OrderConfirmationScreen } from '../OrderConfirmationScreen';

const mockDismissTo = jest.fn();
let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({
  useRouter: () => ({ dismissTo: mockDismissTo }),
  useLocalSearchParams: () => mockParams,
}));

describe('<OrderConfirmationScreen />', () => {
  it('shows the receipt details and returns to the catalogue', async () => {
    const user = userEvent.setup();
    mockParams = { reference: 'BN_123', amount: '750000', last4: '4242' };
    await render(<OrderConfirmationScreen />);

    expect(screen.getByRole('heading', { name: 'Order confirmed' })).toBeOnTheScreen();
    expect(screen.getByText('₦7,500')).toBeOnTheScreen();
    expect(screen.getByText('Paid with card ending 4242')).toBeOnTheScreen();
    expect(screen.getByText('Reference: BN_123')).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Continue shopping' }));
    expect(mockDismissTo).toHaveBeenCalledWith('/');
  });

  it('still renders when opened without params', async () => {
    mockParams = {};
    await render(<OrderConfirmationScreen />);
    expect(screen.getByRole('heading', { name: 'Order confirmed' })).toBeOnTheScreen();
    expect(screen.queryByText(/Reference/)).not.toBeOnTheScreen();
  });
});
