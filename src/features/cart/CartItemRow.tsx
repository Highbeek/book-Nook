import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BookCover } from '@/components/BookCover';
import { Price } from '@/components/Price';
import { colors, font, spacing } from '@/theme';

import { useCartStore, type CartLine } from './cartStore';
import { QuantityStepper } from './QuantityStepper';

function CartItemRowComponent({ line }: { line: CartLine }) {
  const { book, quantity } = line;
  const increment = useCartStore((s) => s.increment);
  const decrement = useCartStore((s) => s.decrement);
  const removeItem = useCartStore((s) => s.removeItem);

  return (
    <View style={styles.row} testID={`cart-line-${book.id}`}>
      <BookCover coverId={book.coverId} title={book.title} width={56} height={84} size="S" />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {book.title}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          <Price amount={book.price} style={styles.unitPrice} /> each
        </Text>
        <View style={styles.controls}>
          <QuantityStepper
            quantity={quantity}
            itemLabel={book.title}
            onIncrement={() => increment(book.id)}
            onDecrement={() => decrement(book.id)}
          />
          <Pressable
            role="button"
            aria-label={`Remove ${book.title} from cart`}
            onPress={() => removeItem(book.id)}
            hitSlop={8}
          >
            <Text style={styles.remove}>Remove</Text>
          </Pressable>
        </View>
      </View>
      <Price amount={book.price} quantity={quantity} testID={`line-total-${book.id}`} />
    </View>
  );
}

export const CartItemRow = memo(CartItemRowComponent);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  info: { flex: 1, gap: spacing.xs },
  title: { fontSize: font.body, fontWeight: '600', color: colors.text },
  meta: { fontSize: font.caption, color: colors.textMuted },
  unitPrice: { fontSize: font.caption, color: colors.textMuted, fontWeight: '500' },
  controls: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginTop: spacing.xs },
  remove: { color: colors.danger, fontSize: font.caption, fontWeight: '600' },
});
