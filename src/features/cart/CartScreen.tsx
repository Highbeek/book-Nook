import { useRouter } from 'expo-router';
import { FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { EmptyView } from '@/components/StateViews';
import { colors, spacing } from '@/theme';

import { CartItemRow } from './CartItemRow';
import { CartSummary } from './CartSummary';
import { useCartStore, type CartLine } from './cartStore';

const keyExtractor = (line: CartLine) => line.book.id;
const renderItem = ({ item }: { item: CartLine }) => <CartItemRow line={item} />;

export function CartScreen() {
  const lines = useCartStore((s) => s.lines);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  if (lines.length === 0) {
    return (
      <View style={styles.screen}>
        <EmptyView title="Your cart is empty" message="Books you add will show up here." />
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          <Button label="Browse books" variant="secondary" onPress={() => router.dismissTo('/')} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList data={lines} keyExtractor={keyExtractor} renderItem={renderItem} />
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <CartSummary />
        <Button
          label="Checkout"
          onPress={() => router.push('/checkout')}
          testID="checkout-button"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  footer: {
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
