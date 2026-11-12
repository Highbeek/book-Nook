import { memo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { BookSummary } from '@/api/types';
import { BookCover } from '@/components/BookCover';
import { Price } from '@/components/Price';
import { colors, font, radius, spacing } from '@/theme';
import type { ViewHandle, ViewRef } from '@/utils/refs';

/** Fixed row height lets FlatList skip measurement entirely via getItemLayout. */
export const BOOK_ROW_HEIGHT = 120;
const COVER_WIDTH = 64;
const COVER_HEIGHT = 96;

export interface BookRowProps {
  book: BookSummary;
  onPress: (book: BookSummary) => void;
  onAddToCart: (book: BookSummary, source: ViewRef) => void;
}

function BookRowComponent({ book, onPress, onAddToCart }: BookRowProps) {
  const coverRef = useRef<ViewHandle>(null);
  const byline = [book.authors.slice(0, 2).join(', '), book.firstPublishYear]
    .filter(Boolean)
    .join(' · ');

  return (
    <Pressable
      role="button"
      aria-label={`${book.title}${book.authors[0] ? ` by ${book.authors[0]}` : ''}`}
      onPress={() => onPress(book)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View ref={coverRef} collapsable={false}>
        <BookCover
          coverId={book.coverId}
          title={book.title}
          width={COVER_WIDTH}
          height={COVER_HEIGHT}
        />
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {book.title}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {byline || 'Unknown author'}
        </Text>
        <View style={styles.footer}>
          <Price amount={book.price} />
          <Pressable
            role="button"
            aria-label={`Add ${book.title} to cart`}
            hitSlop={8}
            onPress={() => onAddToCart(book, coverRef)}
            style={({ pressed }) => [styles.add, pressed && styles.addPressed]}
          >
            <Text style={styles.addText}>Add</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

/** Memoised: rows only re-render when their book or the (stable) callbacks change. */
export const BookRow = memo(BookRowComponent);

const styles = StyleSheet.create({
  row: {
    height: BOOK_ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  pressed: { backgroundColor: colors.surfaceMuted },
  info: { flex: 1, height: COVER_HEIGHT, justifyContent: 'space-between' },
  title: { fontSize: font.body, fontWeight: '600', color: colors.text },
  meta: { fontSize: font.caption, color: colors.textMuted },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  add: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  addPressed: { backgroundColor: colors.surfaceMuted },
  addText: { color: colors.primary, fontWeight: '600', fontSize: font.caption },
});
