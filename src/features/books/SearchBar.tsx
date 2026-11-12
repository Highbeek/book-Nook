import { useState } from 'react';
import { Keyboard, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { colors, font, radius, spacing } from '@/theme';
import { AppText } from '@/components/AppText';

export interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
}

export function SearchBar({ value, onChangeText }: SearchBarProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.row}>
      <View style={styles.field}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Search by title or author"
          placeholderTextColor={colors.textMuted}
          aria-label="Search books"
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          submitBehavior="blurAndSubmit"
          clearButtonMode="never"
          style={styles.input}
        />
        {value.length > 0 ? (
          <Pressable
            role="button"
            aria-label="Clear search"
            onPress={() => onChangeText('')}
            hitSlop={10}
            style={styles.clear}
          >
            <AppText tone="muted">✕</AppText>
          </Pressable>
        ) : null}
      </View>
      {focused ? (
        <Pressable
          role="button"
          aria-label="Close keyboard"
          onPress={() => Keyboard.dismiss()}
          hitSlop={10}
        >
          <AppText tone="primary" weight="semibold">
            Cancel
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
  },
  field: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: { flex: 1, height: 44, fontSize: font.body, color: colors.text },
  clear: { padding: spacing.xs },
});
