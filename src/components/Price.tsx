import { memo } from 'react';
import { StyleSheet, type StyleProp, type TextStyle } from 'react-native';

import { colors, font } from '@/theme';
import { formatPrice } from '@/utils/currency';
import { AppText } from './AppText';

export type PriceVariant = 'default' | 'large' | 'total';

export interface PriceProps {
  /** Amount in minor units (kobo). */
  amount: number;
  quantity?: number;
  variant?: PriceVariant;
  style?: StyleProp<TextStyle>;
  testID?: string;
}

function PriceComponent({ amount, quantity = 1, variant = 'default', style, testID }: PriceProps) {
  const label = formatPrice(amount * quantity);
  return (
    <AppText
      testID={testID}
      style={[styles.base, styles[variant], style]}
      aria-label={`Price ${label}`}
      numberOfLines={1}
    >
      {label}
    </AppText>
  );
}

export const Price = memo(PriceComponent);

const styles = StyleSheet.create({
  base: { color: colors.text, fontWeight: '600', fontVariant: ['tabular-nums'] },
  default: { fontSize: font.body },
  large: { fontSize: font.heading, color: colors.primary, fontWeight: '700' },
  total: { fontSize: font.title, fontWeight: '700' },
});
