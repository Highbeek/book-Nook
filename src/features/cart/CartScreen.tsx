import { Stack, useRouter } from 'expo-router';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { EmptyView } from '@/components/StateViews';
import { colors, font, spacing } from '@/theme';

import { CartItemRow } from './CartItemRow';
import { CartSummary } from './CartSummary';
import { useCartStore, type CartLine } from './cartStore';

const keyExtractor = (line: CartLine) => line.book.id;
const renderItem = ({ item }: { item: CartLine }) => <CartItemRow line={item} />;

export function CartScreen() {
  const lines = useCartStore((s) => s.lines);
  const clear = useCartStore((s) => s.clear);
  const router = useRouter();

  // Destructive and not undoable, so confirm first.
  const confirmClear = () =>
    Alert.alert('Clear cart?', 'This removes every book from your cart.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: clear },
    ]);
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
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable role="button" aria-label="Clear cart" onPress={confirmClear} hitSlop={10}>
              <Text style={styles.clear}>Clear</Text>
            </Pressable>
          ),
        }}
      />
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
  clear: { color: colors.danger, fontSize: font.body, fontWeight: '600' },
  footer: {
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
