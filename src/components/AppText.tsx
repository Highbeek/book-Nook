import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { colors, font } from '@/theme';

export type TextVariant = 'display' | 'heading' | 'title' | 'body' | 'caption';
export type TextTone =
  'default' | 'muted' | 'primary' | 'danger' | 'success' | 'accent' | 'inverse';
export type TextWeight = 'regular' | 'medium' | 'semibold' | 'bold';

export interface AppTextProps extends TextProps {
  variant?: TextVariant;

  tone?: TextTone;

  weight?: TextWeight;
  align?: TextStyle['textAlign'];
}

export function AppText({
  variant = 'body',
  tone = 'default',
  weight,
  align,
  style,
  ...props
}: AppTextProps) {
  return (
    <Text
      style={[
        variants[variant],
        tones[tone],
        weight ? weights[weight] : null,
        align ? { textAlign: align } : null,
        style,
      ]}
      {...props}
    />
  );
}

const variants = StyleSheet.create({
  display: { fontSize: font.display, fontWeight: '700' },
  heading: { fontSize: font.heading, fontWeight: '700' },
  title: { fontSize: font.title, fontWeight: '700' },
  body: { fontSize: font.body },
  caption: { fontSize: font.caption },
});

const tones = StyleSheet.create({
  default: { color: colors.text },
  muted: { color: colors.textMuted },
  primary: { color: colors.primary },
  danger: { color: colors.danger },
  success: { color: colors.success },
  accent: { color: colors.accent },
  inverse: { color: colors.onPrimary },
});

const weights = StyleSheet.create({
  regular: { fontWeight: '400' },
  medium: { fontWeight: '500' },
  semibold: { fontWeight: '600' },
  bold: { fontWeight: '700' },
});
