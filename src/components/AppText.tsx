import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { colors, font } from '@/theme';

export type TextVariant = 'display' | 'heading' | 'title' | 'body' | 'caption';
export type TextTone =
  'default' | 'muted' | 'primary' | 'danger' | 'success' | 'accent' | 'inverse';
export type TextWeight = 'regular' | 'medium' | 'semibold' | 'bold';

export interface AppTextProps extends TextProps {
  /** Size step from the type scale. Defaults to `body`. */
  variant?: TextVariant;
  /** Semantic colour. Defaults to `default` (primary text colour). */
  tone?: TextTone;
  /** Overrides the variant's default weight. */
  weight?: TextWeight;
  align?: TextStyle['textAlign'];
}

/**
 * The app's one text primitive: size, colour and weight come from the theme via props, so
 * screens don't repeat `fontSize`/`color` styles. `style` still works for one-off layout tweaks.
 */
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
