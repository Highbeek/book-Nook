import { StyleSheet, View } from 'react-native';

import { PulseOnChange } from '@/animation/PulseOnChange';
import { Price } from '@/components/Price';
import { spacing } from '@/theme';

import { selectItemCount, selectTotal, useCartStore } from './cartStore';
import { AppText } from '@/components/AppText';

export function CartSummary() {
  const total = useCartStore(selectTotal);
  const count = useCartStore(selectItemCount);

  return (
    <View style={styles.box}>
      <View style={styles.row}>
        <AppText>
          Subtotal ({count} {count === 1 ? 'item' : 'items'})
        </AppText>
        <PulseOnChange value={total}>
          <Price amount={total} variant="total" testID="cart-total" />
        </PulseOnChange>
      </View>
      <AppText variant="caption" tone="muted">
        Delivery is free on all orders.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: spacing.xs },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
