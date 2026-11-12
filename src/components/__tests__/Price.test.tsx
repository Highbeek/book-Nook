import { render, screen } from '@testing-library/react-native';

import { Price } from '../Price';
import { formatPrice } from '@/utils/currency';

describe('formatPrice', () => {
  it.each([
    [0, '₦0'],
    [2_500_00, '₦2,500'],
    [1_234_567_89, '₦1,234,567.89'],
    [99, '₦0.99'],
  ])('formats %d kobo as %s', (kobo, expected) => {
    expect(formatPrice(kobo)).toBe(expected);
  });

  it('rounds stray fractional kobo instead of showing float noise', () => {
    expect(formatPrice(250000.0000001)).toBe('₦2,500');
  });

  it('renders a placeholder for non-finite amounts', () => {
    expect(formatPrice(NaN)).toBe('—');
    expect(formatPrice(Infinity)).toBe('—');
  });
});

describe('<Price />', () => {
  it('renders the formatted amount with an accessible label', async () => {
    await render(<Price amount={4_550_00} />);
    expect(screen.getByText('₦4,550')).toBeOnTheScreen();
    expect(screen.getByLabelText('Price ₦4,550')).toBeOnTheScreen();
  });

  it('multiplies by quantity for line totals', async () => {
    await render(<Price amount={2_500_00} quantity={3} />);
    expect(screen.getByText('₦7,500')).toBeOnTheScreen();
  });

  it('shows zero for an empty total', async () => {
    await render(<Price amount={0} variant="total" testID="total" />);
    expect(screen.getByTestId('total')).toHaveTextContent('₦0');
  });

  it('updates when the amount changes', async () => {
    const view = await render(<Price amount={1_000_00} />);
    await view.rerender(<Price amount={2_000_00} />);
    expect(screen.getByText('₦2,000')).toBeOnTheScreen();
    expect(screen.queryByText('₦1,000')).not.toBeOnTheScreen();
  });
});
