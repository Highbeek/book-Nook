import { useRouter } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Price } from '@/components/Price';
import { EmptyView } from '@/components/StateViews';
import { selectItemCount, selectTotal, useCartStore } from '@/features/cart/cartStore';
import { colors, font, radius, spacing } from '@/theme';

import { CheckoutForm } from './CheckoutForm';
import type { PaymentProcessor, PaymentReceipt } from './paymentService';

export function CheckoutScreen({ pay }: { pay?: PaymentProcessor }) {
  const router = useRouter();
  const total = useCartStore(selectTotal);
  const count = useCartStore(selectItemCount);
  const clear = useCartStore((s) => s.clear);

  const handleSuccess = (receipt: PaymentReceipt) => {
    clear();
    // replace, so "back" can't return to checkout with an empty cart.
    router.replace({
      pathname: '/order-confirmation',
      params: {
        reference: receipt.reference,
        amount: String(receipt.amount),
        last4: receipt.last4,
      },
    });
  };

  if (count === 0) {
    return (
      <View style={styles.screen}>
        <EmptyView title="Nothing to check out" message="Add a book to your cart first." />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>
            Order total · {count} {count === 1 ? 'item' : 'items'}
          </Text>
          <Price amount={total} variant="large" testID="checkout-total" />
        </View>
        <CheckoutForm amount={total} onSuccess={handleSuccess} pay={pay} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.xl },
  summary: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  summaryLabel: { fontSize: font.caption, color: colors.textMuted },
});
