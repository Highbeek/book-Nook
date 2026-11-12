# Book Nook

A React Native (Expo + TypeScript) bookstore. You can browse and search a real catalogue of over 600,000 books, open a book's details, add books to a cart and adjust quantities, and complete a mock checkout.

## Setup

Requirements: Node 22.13+ (or 24+), plus the iOS Simulator, an Android emulator, or the Expo Go app on a phone.

```bash
npm install
npm start            # then press i (iOS), a (Android), or scan the QR code with Expo Go
```

| Script                  | What it does                       |
| ----------------------- | ---------------------------------- |
| `npm test`              | Runs the Jest + RNTL suite         |
| `npm run test:coverage` | Runs the suite with a coverage report |
| `npm run typecheck`     | `tsc --noEmit`                     |
| `npm run lint`          | ESLint (eslint-config-expo)        |

There are no API keys. Book data comes from the public Open Library API, so the app needs a network connection.

### Environment variables

The API hosts are set in [`.env`](.env) and read in [`src/config/env.ts`](src/config/env.ts). The file is committed with working defaults, so no setup is needed. To point the app at another host (for example a local mock server), override a value in `.env.local`, which is gitignored, and reload the app.

| Variable | Default |
| --- | --- |
| `EXPO_PUBLIC_API_URL` | `https://openlibrary.org` |
| `EXPO_PUBLIC_COVERS_URL` | `https://covers.openlibrary.org` |

Expo inlines `EXPO_PUBLIC_*` values into the app bundle, so they must never hold secrets. If a variable is unset, `env.ts` falls back to the default. Jest doesn't load `.env`, so tests rely on the same fallbacks.

## Features

- **Browse and search.** With no search term, the list shows the Open Library "fiction" subject feed (over 600k works). Typing searches by title or author. Search is debounced by 400 ms, and an older response can't overwrite a newer one.
- **Infinite scroll.** The list fetches 20 books per page. It shows a footer spinner while loading, a retry button if a page fails, and a message at the end of the list. Pull to refresh reloads from page 1.
- **Book details.** Shows the cover, authors, price, description, subjects, and reader reviews (average star rating, total count, and a 5★–1★ breakdown). The screen moves through loading, error (with "Try again"), and success states.
- **Cart.** You can add books, increase or decrease quantities, and remove lines, and the total updates as you go. Adding a book that's already in the cart increases its quantity. Reducing a quantity to 0 removes the line. The cart is saved across app restarts.
- **Add-to-cart animation.** The book's cover flies along an arc into the header cart icon, which then bounces. The animation runs from both the list rows and the details screen. If the OS "reduce motion" setting is on, only the bounce plays.
- **Checkout.** A react-hook-form form validated by a yup schema (name, email format, any 12–19 digit card number, a real and unexpired MM/YY expiry, 3–4 digit CVC), with card formatting as you type, keyboard handling (Next moves between fields, a Done bar above the iOS number pad, and drag or tap outside to close), a mock payment gateway that returns success or decline, and an order confirmation screen.

## Technical choices

### Data source: Open Library

The brief mentions a mock API but doesn't provide one. I used [Open Library](https://openlibrary.org/developers/api) because it's free, needs no key, has real books and covers, and has real search and pagination. That makes it a fair test of performance on a large dataset.

| Need          | Endpoint                                     |
| ------------- | -------------------------------------------- |
| Browse feed   | `GET /subjects/fiction.json?limit&offset`    |
| Search        | `GET /search.json?q&page&limit&fields=…`     |
| Book details  | `GET /works/{id}.json` (+ `/authors/{key}.json`) |
| Covers        | `covers.openlibrary.org/b/id/{id}-{S,M,L}.jpg` |

- **Reviews.** Open Library has no written reviews, but it does have reader star ratings (`/works/{id}/ratings.json`). The details screen shows those under "Reader reviews". Ratings are fetched in parallel with the authors, from the canonical work after any redirect.
- **Prices.** Open Library has no prices, so `priceFor(id)` hashes the work ID into a price between ₦2,500 and ₦15,000 in ₦50 steps. The hash is deterministic, so a book shows the same price in the list, on its details page, and in the cart, on every device.
- **Money is stored as integer kobo.** Totals use integer arithmetic, which avoids floating-point drift such as `0.1 + 0.2`.
- **API layer** ([`src/api`](src/api)). The rest of the app never calls `fetch` directly. `fetchJson` adds a timeout, turns failures into a typed `ApiError` with a message a user can read, and passes cancellation (`AbortError`) through so callers can ignore it. Mappers convert the different Open Library response shapes into a single `BookSummary` / `BookDetail` type.
- **Open Library quirks handled:** works that were merged into another work (redirect stubs) are followed, author or ratings lookups that fail don't fail the whole screen, missing covers and titles get fallbacks, and duplicate books across pages are removed.

### State management: Zustand

The cart is the only state shared across screens. I chose Zustand over Context and over Redux for these reasons:

- **Selective re-renders.** Each component subscribes to only what it needs. The header badge reads `selectItemCount`, and each row reads its own quantity. With a Context provider, every consumer re-renders on every cart change.
- **No boilerplate.** Redux Toolkit would also work, but for a single store with six actions its structure doesn't buy anything.
- **Testable without React.** The cart rules are tested directly through `useCartStore.getState()`, and the UI tests use the same store.
- **Persistence** is one middleware (`persist` with AsyncStorage). Only the cart lines are saved, and each line stores a minimal snapshot of the book.

Data fetching for the list and details screens uses local hooks (`useBooks`, `useBookDetails`) rather than a global store, because that data belongs to a single screen. In a larger app I'd use TanStack Query for caching and deduplicating server data, but here the brief asks for an explicit `useEffect` lifecycle.

### UI primitives

All text goes through [`AppText`](src/components/AppText.tsx), which takes `variant` (display, heading, title, body, caption), `tone` (default, muted, primary, danger, success, accent, inverse), `weight` and `align`, all mapped to the theme. Screens don't repeat `fontSize` or `color` styles, so changing the type scale or a colour is a one-line edit in [`src/theme`](src/theme/index.ts). `style` remains available for layout-only tweaks such as a margin or a fixed width.

### Forms: react-hook-form + yup

The checkout rules live in one yup schema in [`validation.ts`](src/features/checkout/validation.ts), and the form type is inferred from it, so the rules and the types can't drift apart. react-hook-form keeps field state outside React state, so typing in one field doesn't re-render the whole form. Each field is validated as the user types, and fields they haven't touched only show errors after Pay is tapped. The first invalid field gets focus.

Inputs are the shared [`TextField`](src/components/TextField.tsx) (label, error, `aria-invalid`), and [`FormTextField`](src/components/form/FormTextField.tsx) binds one to a form field, with an optional `format` function for things like card number grouping. Any future form (address, sign-in) can reuse both.

### Component lifecycle: Book Details

[`useBookDetails`](src/features/books/useBookDetails.ts) fetches inside `useEffect`, keyed on the book ID and a retry counter.

- The effect's cleanup aborts the request, so a slow response can't update a screen that has unmounted.
- Each request has a key, and any result that doesn't match the current key is ignored. The screen therefore shows a loading state until *this* request finishes, and never shows a stale book or a stale error.
- Every request ends in either success or error, because the client enforces a 15 s timeout. The screen can't get stuck on the spinner.

### Animation: Reanimated 4

I read "React Native Skills" in the brief as "Skia". Skia isn't needed for a fly-to-cart effect, so I used Reanimated, which runs the animation on the UI thread. [`FlyToCartProvider`](src/animation/FlyToCart.tsx) works like this:

- It measures the source cover and the header cart icon with `measureInWindow`.
- It draws a copy of the cover in a non-interactive overlay and animates one progress value through position, a parabolic arc, scale, rotation, and opacity.
- When the flight finishes, it bounces the cart icon.

The cart is updated *immediately* and the animation is decoration only, so state never waits on an animation.

### Performance on large lists

- `FlatList` uses `keyExtractor` and `getItemLayout`. Rows have a fixed height of 120, so the list never needs to measure them, and scrolling or jumping stays O(1). The result count is shown above the list rather than as a list header, because a header would shift the offsets `getItemLayout` calculates.
- Rows are `React.memo`'d, with a stable `renderItem` and stable callbacks, so loading a new page doesn't re-render the rows already on screen.
- `initialNumToRender`, `maxToRenderPerBatch`, `windowSize={7}` and `removeClippedSubviews` keep the number of mounted rows low no matter how far the user scrolls.
- **Images:** `expo-image` loads covers lazily with a memory and disk cache. A `recyclingKey` stops a recycled row from briefly showing the previous book's cover. Rows request medium-size covers and the details screen requests large ones.
- **Pagination is guarded:** a request already in flight blocks new ones, nothing is fetched past the last page, and nothing is fetched while in an error state (so `onEndReached` can't loop on a failing request). Changing the query aborts the previous request.
- **Network:** search requests ask only for the five fields the list uses (`fields=`), and typing in search is debounced.

### Checkout: mock "secure" payment

The brief asks for a secure purchase but gives no payment specification, so checkout is a **mock** that follows the shape of a real integration:

- Validation runs on the device: a 12–19 digit card number (any number works, since it's a demo, so there is no Luhn check), MM/YY expiry that isn't in the past, 3- or 4-digit CVC, and email format. Errors appear and clear as the user types; untouched fields are flagged on submit.
- `processPayment` turns the card into a token and returns only a reference and the last 4 digits. Card data is never stored or logged, and it's discarded when the checkout screen closes.
- A `useRef` guard plus a disabled, busy button prevent a double tap from charging twice.
- The test card `4000 0000 0000 0002` is always declined, and any other valid card number succeeds, for example `4242 4242 4242 4242`.

**A real implementation would:**

- use a provider's SDK or hosted fields (Paystack or Flutterwave in Nigeria, or Stripe), so raw card data never touches our app or servers, which keeps us out of PCI scope;
- create the charge on our backend with a secret key, using an idempotency key to avoid duplicate charges;
- handle 3-D Secure and OTP challenges;
- confirm the payment through a webhook before marking the order as paid.

### Project structure

```
src/
  app/               Expo Router routes (thin re-exports of feature screens)
  api/               HTTP client, Open Library mappers, pricing
  config/            environment config (EXPO_PUBLIC_* with defaults)
  features/
    books/           list, row, search, details, ratings, useBooks, useBookDetails
    cart/            Zustand store, cart screen, rows, stepper, icon
    checkout/        form, yup schema + formatters, mock payment service, confirmation
  animation/         fly-to-cart provider
  components/        AppText, Price, Button, BookCover, TextField, KeyboardDoneBar, loading/error/empty views
    form/            FormTextField (TextField bound to react-hook-form)
  test-utils/        fetch helpers, fixtures, Reanimated test double
```

## Testing

There are 153 tests across 23 suites, with about 98% line coverage (`npm run test:coverage`). They use Jest (`jest-expo`) and React Native Testing Library v14, and query by role and label the way a user or screen reader would.

| Area | What's covered |
| --- | --- |
| **Price component** | Formatting (whole and fractional kobo, large values, zero, NaN), quantity multiplication, re-render on change |
| **Cart add/remove** | Store rules (same book twice gives quantity 2, 0 or negative removes the line, quantity limit, invalid input, ordering, total, clear) and UI (stepper +/−, Remove, line and cart totals update, the last item switches to the empty state) |
| **Book-fetching API** | URL building for browse vs search and pagination, mappers, `hasMore`, HTTP, network, parse and timeout errors, abort, redirect following, failed author and ratings lookups, ratings mapping |
| **Checkout** | yup schema (every rule and message, trimming), card length/expiry/formatters, mock gateway, form (formatting, errors, live re-validation, exact charge payload, busy state, double-tap guard, decline and generic failure) and screen (charges the cart total, clears the cart and navigates on success, keeps the cart on decline) |
| Also | `useBooks` (pagination, duplicate-request guard, stale-response protection on query change, page-level error and retry, refresh, abort on unmount), Book Details lifecycle (loading, success, error, retry, abort on unmount), rating summary (average, counts, singular wording, empty state), env config (defaults, overrides, trailing slashes), TextField (label, error, invalid state), keyboard Done bar (iOS only), list screen (debounced search makes one request, empty and error states, add to cart, navigation), cart icon badge, animation provider |

**About the Reanimated mock:** Reanimated 4.7's bundled Jest mock starts its real runtime, which needs native modules (and DOM APIs on its JS fallback) that Jest doesn't provide. [`src/test-utils/mocks/reanimated.tsx`](src/test-utils/mocks/reanimated.tsx) is a small stand-in covering only the APIs the app uses, and animations finish instantly in it. The tests check the cart state the animation sits on top of, not the animation's timing.

## Trade-offs and next steps

- **Live API.** The app depends on Open Library's uptime and speed, and the browse feed gets slow at very deep offsets. In production I'd put our own backend or cache in front of it. Every screen handles network failure with a retry.
- **Prices are synthetic** (explained above).
- **No E2E tests.** With more time I'd add Maestro flows for browse → add → checkout, and run tests and typecheck in CI.
- Possible additions: a TanStack Query cache shared between list and details, a dark theme, a book detail placeholder built from the list row data, and FlashList if row heights ever become variable.
