import { render, screen, userEvent, waitFor } from '@testing-library/react-native';

import { getBooks } from '@/api/books';
import { ApiError } from '@/api/client';
import { useCartStore } from '@/features/cart/cartStore';
import { makeBook } from '@/test-utils/fixtures';

import { BookListScreen } from '../BookListScreen';

jest.mock('@/api/books', () => ({
  ...jest.requireActual('@/api/books'),
  getBooks: jest.fn(),
}));
const mockGetBooks = jest.mocked(getBooks);

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));

const books = [
  makeBook({ id: 'OL1W', title: 'Things Fall Apart', price: 3_000_00 }),
  makeBook({ id: 'OL2W', title: 'Americanah', authors: ['Chimamanda Ngozi Adichie'] }),
];

beforeEach(() => {
  mockGetBooks.mockReset();
  mockPush.mockReset();
  useCartStore.setState({ lines: [] });
});

describe('<BookListScreen />', () => {
  it('renders the first page of books with prices and a result count', async () => {
    mockGetBooks.mockResolvedValue({ items: books, page: 1, total: 1234, hasMore: true });
    await render(<BookListScreen />);

    expect(await screen.findByText('Things Fall Apart')).toBeOnTheScreen();
    expect(screen.getByText('Americanah')).toBeOnTheScreen();
    expect(screen.getByText('₦3,000')).toBeOnTheScreen();
    expect(screen.getByText('1,234 books')).toBeOnTheScreen();
  });

  it('adds a book to the cart from its row', async () => {
    const user = userEvent.setup();
    mockGetBooks.mockResolvedValue({ items: books, page: 1, total: 2, hasMore: false });
    await render(<BookListScreen />);

    await user.press(await screen.findByRole('button', { name: 'Add Things Fall Apart to cart' }));

    expect(useCartStore.getState().lines).toEqual([
      expect.objectContaining({ quantity: 1, book: expect.objectContaining({ id: 'OL1W' }) }),
    ]);
  });

  it('opens the details screen when a row is pressed', async () => {
    const user = userEvent.setup();
    mockGetBooks.mockResolvedValue({ items: books, page: 1, total: 2, hasMore: false });
    await render(<BookListScreen />);

    await user.press(
      await screen.findByRole('button', { name: 'Americanah by Chimamanda Ngozi Adichie' }),
    );

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/book/[id]',
      params: { id: 'OL2W', title: 'Americanah' },
    });
  });

  it('searches with a debounced, trimmed query', async () => {
    const user = userEvent.setup();
    mockGetBooks.mockResolvedValue({ items: books, page: 1, total: 2, hasMore: false });
    await render(<BookListScreen />);
    await screen.findByText('Things Fall Apart');

    await user.type(screen.getByLabelText('Search books'), ' achebe ');

    await waitFor(() =>
      expect(mockGetBooks).toHaveBeenLastCalledWith(expect.objectContaining({ query: 'achebe' })),
    );

    const searchCalls = mockGetBooks.mock.calls.filter(([params]) => params?.query);
    expect(searchCalls).toHaveLength(1);
  });

  it('shows an empty state when a search has no results', async () => {
    const user = userEvent.setup();
    mockGetBooks.mockResolvedValueOnce({ items: books, page: 1, total: 2, hasMore: false });
    mockGetBooks.mockResolvedValue({ items: [], page: 1, total: 0, hasMore: false });
    await render(<BookListScreen />);
    await screen.findByText('Things Fall Apart');

    await user.type(screen.getByLabelText('Search books'), 'zzzz');

    expect(await screen.findByText('No books found')).toBeOnTheScreen();
  });

  it('shows an error with retry when the first page fails', async () => {
    const user = userEvent.setup();
    mockGetBooks.mockRejectedValueOnce(new ApiError('Network error.', 'network'));
    mockGetBooks.mockResolvedValueOnce({ items: books, page: 1, total: 2, hasMore: false });
    await render(<BookListScreen />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Network error.');
    await user.press(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('Things Fall Apart')).toBeOnTheScreen();
  });
});
