import { useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, font, radius, spacing } from '@/theme';

export interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
}

/**
 * The keyboard can be closed three ways: the "Cancel" button shown while focused,
 * the keyboard's search key, or scrolling the list (keyboardDismissMode="on-drag").
 * Cancel keeps the current query — it only closes the keyboard.
 */
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
            <Text style={styles.clearText}>✕</Text>
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
          <Text style={styles.cancel}>Cancel</Text>
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
  clearText: { color: colors.textMuted, fontSize: font.body },
  cancel: { color: colors.primary, fontSize: font.body, fontWeight: '600' },
});
