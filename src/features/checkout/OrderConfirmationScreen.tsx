import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Price } from '@/components/Price';
import { colors, font, spacing } from '@/theme';

export function OrderConfirmationScreen() {
  const router = useRouter();
  const { reference, amount, last4 } = useLocalSearchParams<{
    reference?: string;
    amount?: string;
    last4?: string;
  }>();

  return (
    <View style={styles.screen}>
      <Text style={styles.icon}>✅</Text>
      <Text style={styles.title} role="heading">
        Order confirmed
      </Text>
      {amount ? <Price amount={Number(amount)} variant="large" /> : null}
      {last4 ? <Text style={styles.meta}>Paid with card ending {last4}</Text> : null}
      {reference ? <Text style={styles.meta}>Reference: {reference}</Text> : null}
      <Text style={styles.meta}>A receipt is on its way to your inbox.</Text>
      <Button label="Continue shopping" onPress={() => router.dismissTo('/')} style={styles.cta} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  icon: { fontSize: 56 },
  title: { fontSize: font.display, fontWeight: '700', color: colors.text },
  meta: { fontSize: font.body, color: colors.textMuted, textAlign: 'center' },
  cta: { alignSelf: 'stretch', marginTop: spacing.xl },
});
