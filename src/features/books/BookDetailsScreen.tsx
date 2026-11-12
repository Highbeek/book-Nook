import { Stack, useLocalSearchParams } from 'expo-router';
import { useRef } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { BookDetail } from '@/api/types';
import { BookCover } from '@/components/BookCover';
import { Button } from '@/components/Button';
import { Price } from '@/components/Price';
import { ErrorView, LoadingView } from '@/components/StateViews';
import { selectQuantity, useCartStore } from '@/features/cart/cartStore';
import { useAddToCart } from '@/features/cart/useAddToCart';
import { colors, font, radius, spacing } from '@/theme';
import type { ViewHandle } from '@/utils/refs';

import { useBookDetails } from './useBookDetails';

export function BookDetailsScreen() {
  const { id, title } = useLocalSearchParams<{ id: string; title?: string }>();
  const details = useBookDetails(id);

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: title ?? 'Book' }} />
      {details.status === 'loading' ? <LoadingView label="Loading book…" /> : null}
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
          <Text style={styles.title} role="heading">
            {book.title}
          </Text>
          {book.authors.length > 0 ? (
            <Text style={styles.authors}>by {book.authors.join(', ')}</Text>
          ) : null}
          {book.firstPublishYear ? (
            <Text style={styles.meta}>First published {book.firstPublishYear}</Text>
          ) : null}
          <Price amount={book.price} variant="large" testID="details-price" />
        </View>

        <Text style={styles.sectionTitle}>About this book</Text>
        <Text style={styles.body}>{book.description ?? 'No description available.'}</Text>

        {book.subjects.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Subjects</Text>
            <View style={styles.chips}>
              {book.subjects.map((subject) => (
                <Text key={subject} style={styles.chip}>
                  {subject}
                </Text>
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>

      <View style={[styles.bar, { paddingBottom: insets.bottom + spacing.md }]}>
        {inCart > 0 ? <Text style={styles.inCart}>{inCart} in cart</Text> : null}
        <Button label="Add to cart" onPress={() => addToCart(book, coverRef)} style={styles.cta} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingBottom: 120, gap: spacing.md },
  hero: { alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  title: {
    fontSize: font.heading,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  authors: { fontSize: font.body, color: colors.textMuted, textAlign: 'center' },
  meta: { fontSize: font.caption, color: colors.textMuted },
  sectionTitle: { fontSize: font.title, fontWeight: '700', color: colors.text },
  body: { fontSize: font.body, lineHeight: 22, color: colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    color: colors.textMuted,
    fontSize: font.caption,
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
  inCart: { color: colors.success, fontWeight: '600' },
  cta: { flex: 1 },
});
