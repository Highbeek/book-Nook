# Book Nook

A React Native (Expo + TypeScript) bookstore app. Browse and search over 600,000 real books, view details, manage a cart, and complete a mock checkout.

## Setup

Requires Node 22.13+ and one of: the iOS Simulator, an Android emulator, or the latest [Expo Go](https://expo.dev/go) on a phone. The app uses Expo SDK 58, so update Expo Go if it reports the project as incompatible.

```bash
git clone https://github.com/Highbeek/book-Nook.git
cd book-Nook
npm install
npm start          # press i (iOS) or a (Android), or scan the QR code with Expo Go
```

`npm run ios` and `npm run android` open a simulator directly. On a physical phone, keep it on the same Wi-Fi network as your computer.

No API keys are needed. Book data comes from the public [Open Library API](https://openlibrary.org/developers/api), so the app needs a network connection. API hosts are set in `.env` and can be overridden in `.env.local`.

## Features

- **Browse and search** a large catalogue with debounced search and infinite scroll.
- **Book details** with cover, description, subjects, price, and reader ratings.
- **Cart** with add/remove, quantity controls, a live total, and persistence across restarts.
- **Add-to-cart animation**: the cover flies into the cart icon, which bounces.
- **Checkout** with validation, card formatting, a mock payment gateway, and an order confirmation.
- Skeleton loaders, error states with retry, and empty states throughout.

## Technical choices

- **Data:** the brief mentions mock APIs but doesn't provide one, so I used Open Library: real books, covers, search and pagination, which makes it a fair test of performance on a large dataset. It has no prices, so each book gets a stable price derived from its ID. It has no written reviews, so the app shows its reader star ratings.
- **Component lifecycle:** [`useBookDetails`](src/features/books/useBookDetails.ts) fetches in `useEffect` and shows loading, error (with retry) and success states. Cleanup aborts the request on unmount, and stale responses are ignored.
- **State management:** Zustand for the cart. Components subscribe only to the values they need, so the badge, rows and total re-render independently. Persistence takes one middleware, and the store is tested without React.
- **Animation:** Reanimated runs the fly-to-cart animation on the UI thread. The cart updates immediately and the animation is decoration only. It respects the system Reduce Motion setting.
- **Performance:** paginated requests (20 per page), `FlatList` with fixed row heights (`getItemLayout`), memoised rows, lazy-loaded and cached covers via `expo-image`, trimmed API fields, and an in-memory cache so reopening a book is instant.
- **Forms:** react-hook-form with a yup schema. Reusable `TextField` and `AppText` components keep styling consistent.
- **Payments:** checkout is a mock that mirrors a real flow (tokenise, then charge) and never stores card data. In production this would use a provider SDK such as Paystack or Stripe, with charges created on a backend. Card `4000 0000 0000 0002` is always declined; any other valid card succeeds.

## Testing

159 tests (Jest + React Native Testing Library), with about 97% line coverage. They cover the price component, cart add/remove, the book-fetching API, checkout (validation, payment success and decline, double-tap protection), and screen lifecycles. Tests query by role and label, the way a user or screen reader would.

```bash
npm test
npm run test:coverage
```

## Trade-offs

- Depends on Open Library's availability. Every screen handles network failures with a retry.
- Prices are synthetic, and payment is mocked.
- Next steps: end-to-end tests (e.g. Maestro), CI, and TanStack Query for server-state caching.
