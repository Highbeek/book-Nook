import { Pressable, StyleSheet, View } from 'react-native';

import { PulseOnChange } from '@/animation/PulseOnChange';
import { colors, radius } from '@/theme';

import { MAX_QUANTITY } from './cartStore';
import { AppText } from '@/components/AppText';

export interface QuantityStepperProps {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  itemLabel: string;
}

export function QuantityStepper({
  quantity,
  onIncrement,
  onDecrement,
  itemLabel,
}: QuantityStepperProps) {
  const atMax = quantity >= MAX_QUANTITY;
  return (
    <View style={styles.row}>
      <Pressable
        role="button"
        aria-label={quantity === 1 ? `Remove ${itemLabel}` : `Decrease quantity of ${itemLabel}`}
        onPress={onDecrement}
        hitSlop={6}
        style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
      >
        <AppText tone="primary" weight="semibold" style={styles.btnText}>
          −
        </AppText>
      </Pressable>
      <PulseOnChange value={quantity}>
        <AppText
          weight="semibold"
          align="center"
          style={styles.qty}
          aria-label={`Quantity ${quantity}`}
          testID="quantity"
        >
          {quantity}
        </AppText>
      </PulseOnChange>
      <Pressable
        role="button"
        aria-label={`Increase quantity of ${itemLabel}`}
        aria-disabled={atMax}
        disabled={atMax}
        onPress={onIncrement}
        hitSlop={6}
        style={({ pressed }) => [styles.btn, pressed && styles.pressed, atMax && styles.disabled]}
      >
        <AppText tone="primary" weight="semibold" style={styles.btnText}>
          +
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  btn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  pressed: { backgroundColor: colors.surfaceMuted, borderRadius: radius.pill },
  disabled: { opacity: 0.35 },
  btnText: { fontSize: 20 },
  qty: { minWidth: 28, fontVariant: ['tabular-nums'] },
});
