import { render, screen, userEvent } from '@testing-library/react-native';

import { getBookById } from '@/api/books';
import { ApiError } from '@/api/client';
import type { BookDetail } from '@/api/types';
import { useCartStore } from '@/features/cart/cartStore';
import { deferred } from '@/test-utils/deferred';
import { makeBookDetail } from '@/test-utils/fixtures';

import { BookDetailsScreen } from '../BookDetailsScreen';

jest.mock('@/api/books', () => ({
  ...jest.requireActual('@/api/books'),
  getBookById: jest.fn(),
}));
const mockGetBookById = jest.mocked(getBookById);

let mockParams: Record<string, string> = { id: 'OL1W', title: 'Things Fall Apart' };
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockParams,
  Stack: { Screen: () => null },
}));

const book = makeBookDetail({ id: 'OL1W', title: 'Things Fall Apart', price: 4_500_00 });

beforeEach(() => {
  mockGetBookById.mockReset();
  mockParams = { id: 'OL1W', title: 'Things Fall Apart' };
  useCartStore.setState({ lines: [] });
});

describe('<BookDetailsScreen />', () => {
  it('shows a loading indicator, then the book on success', async () => {
    const request = deferred<BookDetail>();
    mockGetBookById.mockReturnValue(request.promise);
    await render(<BookDetailsScreen />);

    expect(screen.getByRole('progressbar', { name: 'Loading book…' })).toBeOnTheScreen();
    expect(mockGetBookById).toHaveBeenCalledWith('OL1W', expect.any(AbortSignal));

    request.resolve(book);

    expect(await screen.findByRole('heading', { name: 'Things Fall Apart' })).toBeOnTheScreen();
    expect(screen.getByText('by Chinua Achebe')).toBeOnTheScreen();
    expect(screen.getByTestId('details-price')).toHaveTextContent('₦4,500');
    expect(screen.getByText('Okonkwo, a proud Igbo warrior…')).toBeOnTheScreen();
    expect(screen.queryByRole('progressbar')).not.toBeOnTheScreen();
  });

  it('shows an error message on failure instead of spinning forever', async () => {
    mockGetBookById.mockRejectedValue(
      new ApiError('Network error. Check your connection.', 'network'),
    );
    await render(<BookDetailsScreen />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Network error. Check your connection.',
    );
    expect(screen.queryByRole('progressbar')).not.toBeOnTheScreen();
  });

  it('retries after an error and recovers', async () => {
    const user = userEvent.setup();
    mockGetBookById.mockRejectedValueOnce(new ApiError('Request failed (500).', 'http', 500));
    mockGetBookById.mockResolvedValueOnce(book);
    await render(<BookDetailsScreen />);

    await user.press(await screen.findByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('heading', { name: 'Things Fall Apart' })).toBeOnTheScreen();
    expect(mockGetBookById).toHaveBeenCalledTimes(2);
  });

  it('falls back gracefully when the book has no description', async () => {
    mockGetBookById.mockResolvedValue({ ...book, description: null, subjects: [] });
    await render(<BookDetailsScreen />);
    expect(await screen.findByText('No description available.')).toBeOnTheScreen();
  });

  it('adds the book to the cart', async () => {
    const user = userEvent.setup();
    mockGetBookById.mockResolvedValue(book);
    await render(<BookDetailsScreen />);

    await user.press(await screen.findByRole('button', { name: 'Add to cart' }));
    await user.press(screen.getByRole('button', { name: 'Add to cart' }));

    expect(useCartStore.getState().lines).toEqual([
      expect.objectContaining({ quantity: 2, book: expect.objectContaining({ id: 'OL1W' }) }),
    ]);
    expect(screen.getByText('2 in cart')).toBeOnTheScreen();
  });

  it('aborts the request when the screen unmounts', async () => {
    mockGetBookById.mockReturnValue(new Promise(() => {}));
    const view = await render(<BookDetailsScreen />);
    const signal = mockGetBookById.mock.calls[0][1] as AbortSignal;
    expect(signal.aborted).toBe(false);

    await view.unmount();
    expect(signal.aborted).toBe(true);
  });

  it('shows an error when no id is provided', async () => {
    mockParams = {};
    await render(<BookDetailsScreen />);
    expect(screen.getByRole('alert')).toHaveTextContent('No book was selected.');
    expect(mockGetBookById).not.toHaveBeenCalled();
  });
});
