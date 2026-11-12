import { StyleSheet, Text, View } from 'react-native';

import { Price } from '@/components/Price';
import { colors, font, spacing } from '@/theme';

import { selectItemCount, selectTotal, useCartStore } from './cartStore';

export function CartSummary() {
  const total = useCartStore(selectTotal);
  const count = useCartStore(selectItemCount);

  return (
    <View style={styles.box}>
      <View style={styles.row}>
        <Text style={styles.label}>
          Subtotal ({count} {count === 1 ? 'item' : 'items'})
        </Text>
        <Price amount={total} variant="total" testID="cart-total" />
      </View>
      <Text style={styles.note}>Delivery is free on all orders.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: spacing.xs },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: font.body, color: colors.text },
  note: { fontSize: font.caption, color: colors.textMuted },
});
