import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, font, radius, spacing } from '@/theme';

export interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
}

export function SearchBar({ value, onChangeText }: SearchBarProps) {
  return (
    <View style={styles.wrap}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Search by title or author"
        placeholderTextColor={colors.textMuted}
        aria-label="Search books"
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
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
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: { flex: 1, height: 44, fontSize: font.body, color: colors.text },
  clear: { padding: spacing.xs },
  clearText: { color: colors.textMuted, fontSize: font.body },
});
