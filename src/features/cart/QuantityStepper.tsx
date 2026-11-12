import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, font, radius } from '@/theme';

import { MAX_QUANTITY } from './cartStore';

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
        <Text style={styles.btnText}>−</Text>
      </Pressable>
      <Text style={styles.qty} aria-label={`Quantity ${quantity}`} testID="quantity">
        {quantity}
      </Text>
      <Pressable
        role="button"
        aria-label={`Increase quantity of ${itemLabel}`}
        aria-disabled={atMax}
        disabled={atMax}
        onPress={onIncrement}
        hitSlop={6}
        style={({ pressed }) => [styles.btn, pressed && styles.pressed, atMax && styles.disabled]}
      >
        <Text style={styles.btnText}>+</Text>
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
  btnText: { fontSize: 20, color: colors.primary, fontWeight: '600' },
  qty: {
    minWidth: 28,
    textAlign: 'center',
    fontSize: font.body,
    fontWeight: '600',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
});
