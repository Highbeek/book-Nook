import { Stack, useLocalSearchParams } from 'expo-router';
import { useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { BookDetail } from '@/api/types';
import { BookCover } from '@/components/BookCover';
import { Button } from '@/components/Button';
import { Price } from '@/components/Price';
import { ErrorView } from '@/components/StateViews';
import { selectQuantity, useCartStore } from '@/features/cart/cartStore';
import { useAddToCart } from '@/features/cart/useAddToCart';
import { colors, radius, spacing } from '@/theme';
import type { ViewHandle } from '@/utils/refs';

import { RatingSummary } from './RatingSummary';
import { BookDetailsSkeleton } from './BookSkeletons';
import { useBookDetails } from './useBookDetails';
import { AppText } from '@/components/AppText';

export function BookDetailsScreen() {
  const { id, title } = useLocalSearchParams<{ id: string; title?: string }>();
  const details = useBookDetails(id);

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: title ?? 'Book' }} />
      {details.status === 'loading' ? <BookDetailsSkeleton label="Loading book…" /> : null}
      {details.status === 'error' ? (
        <ErrorView message={details.error} onRetry={details.retry} />
      ) : null}
      {details.status === 'success' ? <BookDetailsContent book={details.book} /> : null}
    </View>
  );
}

export function BookDetailsContent({ book }: { book: BookDetail }) {
  const insets = useSafeAreaInsets();
  const coverRef = useRef<ViewHandle>(null);
  const addToCart = useAddToCart();
  const inCart = useCartStore(selectQuantity(book.id));

  return (
    <>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View ref={coverRef} collapsable={false}>
            <BookCover
              coverId={book.coverId}
              title={book.title}
              width={160}
              height={240}
              size="L"
            />
          </View>
          <AppText variant="heading" align="center" style={styles.title} role="heading">
            {book.title}
          </AppText>
          {book.authors.length > 0 ? (
            <AppText tone="muted" align="center">
              by {book.authors.join(', ')}
            </AppText>
          ) : null}
          {book.firstPublishYear ? (
            <AppText variant="caption" tone="muted">
              First published {book.firstPublishYear}
            </AppText>
          ) : null}
          <Price amount={book.price} variant="large" testID="details-price" />
        </View>

        <AppText variant="title">About this book</AppText>
        <AppText style={styles.body}>{book.description ?? 'No description available.'}</AppText>

        <AppText variant="title">Reader reviews</AppText>
        <RatingSummary rating={book.rating} />

        {book.subjects.length > 0 ? (
          <>
            <AppText variant="title">Subjects</AppText>
            <View style={styles.chips}>
              {book.subjects.map((subject) => (
                <AppText variant="caption" tone="muted" style={styles.chip} key={subject}>
                  {subject}
                </AppText>
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>

      <View style={[styles.bar, { paddingBottom: insets.bottom + spacing.md }]}>
        {inCart > 0 ? (
          <AppText tone="success" weight="semibold">
            {inCart} in cart
          </AppText>
        ) : null}
        <Button label="Add to cart" onPress={() => addToCart(book, coverRef)} style={styles.cta} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingBottom: 120, gap: spacing.md },
  hero: { alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  title: { marginTop: spacing.md },
  body: { lineHeight: 22 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
  },
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  cta: { flex: 1 },
});
