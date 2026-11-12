import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOutLeft } from 'react-native-reanimated';

import { PulseOnChange } from '@/animation/PulseOnChange';
import { BookCover } from '@/components/BookCover';
import { Price } from '@/components/Price';
import { colors, font, spacing } from '@/theme';

import { useCartStore, type CartLine } from './cartStore';
import { QuantityStepper } from './QuantityStepper';
import { AppText } from '@/components/AppText';

function CartItemRowComponent({ line }: { line: CartLine }) {
  const { book, quantity } = line;
  const increment = useCartStore((s) => s.increment);
  const decrement = useCartStore((s) => s.decrement);
  const removeItem = useCartStore((s) => s.removeItem);

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOutLeft.duration(220)}
      style={styles.row}
      testID={`cart-line-${book.id}`}
    >
      <BookCover coverId={book.coverId} title={book.title} width={56} height={84} size="S" />
      <View style={styles.info}>
        <AppText weight="semibold" numberOfLines={2}>
          {book.title}
        </AppText>
        <AppText variant="caption" tone="muted" numberOfLines={1}>
          <Price amount={book.price} style={styles.unitPrice} /> each
        </AppText>
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
            <AppText variant="caption" tone="danger" weight="semibold">
              Remove
            </AppText>
          </Pressable>
        </View>
      </View>
      <PulseOnChange value={quantity}>
        <Price amount={book.price} quantity={quantity} testID={`line-total-${book.id}`} />
      </PulseOnChange>
    </Animated.View>
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
  unitPrice: { fontSize: font.caption, color: colors.textMuted, fontWeight: '500' },
  controls: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginTop: spacing.xs },
});
