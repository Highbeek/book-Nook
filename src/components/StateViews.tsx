import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors, font, spacing } from '@/theme';

import { Button } from './Button';

export function LoadingView({ label = 'Loading…' }: { label?: string }) {
  return (
    <View style={styles.center} accessible role="progressbar" aria-label={label} aria-busy>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.muted}>{label}</Text>
    </View>
  );
}

export function ErrorView({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.muted} role="alert">
        {message}
      </Text>
      {onRetry ? <Button label="Try again" onPress={onRetry} style={styles.action} /> : null}
    </View>
  );
}

export function EmptyView({ title, message }: { title: string; message?: string }) {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.muted}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  title: { fontSize: font.title, fontWeight: '700', color: colors.text, textAlign: 'center' },
  muted: { fontSize: font.body, color: colors.textMuted, textAlign: 'center' },
  action: { marginTop: spacing.md },
});
