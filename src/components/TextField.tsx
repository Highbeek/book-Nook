import type { ComponentRef, Ref } from 'react';
import {
  StyleSheet,
  TextInput,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { colors, font, radius, spacing } from '@/theme';
import { AppText } from './AppText';

export interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string;

  style?: StyleProp<ViewStyle>;
  ref?: Ref<ComponentRef<typeof TextInput>>;
}

export function TextField({ label, error, style, ref, ...input }: TextFieldProps) {
  return (
    <Animated.View layout={LinearTransition.duration(180)} style={[styles.field, style]}>
      <AppText variant="caption" tone="muted" weight="semibold">
        {label}
      </AppText>
      <TextInput
        ref={ref}
        aria-label={label}
        aria-invalid={Boolean(error)}
        placeholderTextColor={colors.textMuted}
        autoCorrect={false}
        style={[styles.input, error ? styles.inputError : null]}
        {...input}
      />
      {error ? (
        <Animated.View key={error} entering={FadeIn.duration(180)} exiting={FadeOut.duration(120)}>
          <AppText variant="caption" tone="danger">
            {error}
          </AppText>
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  input: {
    height: 46,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    fontSize: font.body,
    color: colors.text,
  },
  inputError: { borderColor: colors.danger },
});
