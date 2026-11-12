import { useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { EmptyView } from '@/components/StateViews';
import { colors, spacing } from '@/theme';
import { useResetStack } from '@/utils/navigation';

import { CartItemRow } from './CartItemRow';
import { CartSummary } from './CartSummary';
import { selectItemCount, useCartStore, type CartLine } from './cartStore';
import { AppText } from '@/components/AppText';

const emptyCartImage = require('../../../assets/icons/shopping-cart.png');

const keyExtractor = (line: CartLine) => line.book.id;
const renderItem = ({ item }: { item: CartLine }) => <CartItemRow line={item} />;

export function CartScreen() {
  const lines = useCartStore((s) => s.lines);
  const count = useCartStore(selectItemCount);
  const clear = useCartStore((s) => s.clear);
  const router = useRouter();
  const resetStack = useResetStack();

  const browseBooks = () => resetStack('index');
  const insets = useSafeAreaInsets();
  const footerStyle = [styles.footer, { paddingBottom: insets.bottom + spacing.md }];

  const confirmClear = () =>
    Alert.alert('Clear cart?', 'This removes every book from your cart.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: clear },
    ]);

  if (lines.length === 0) {
    return (
      <View style={styles.screen}>
        <EmptyView
          image={emptyCartImage}
          title="Your cart is empty"
          message="Books you add will show up here."
        />
        <View style={footerStyle}>
          <Button label="Browse books" variant="secondary" onPress={browseBooks} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.toolbar}>
        <AppText variant="caption" tone="muted">
          {count} {count === 1 ? 'item' : 'items'}
        </AppText>
        <Pressable role="button" aria-label="Clear cart" onPress={confirmClear} hitSlop={10}>
          <AppText variant="caption" tone="danger" weight="semibold">
            Clear all
          </AppText>
        </Pressable>
      </View>
      <Animated.FlatList
        data={lines}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        itemLayoutAnimation={LinearTransition.duration(220)}
      />
      <View style={footerStyle}>
        <CartSummary />
        <Button label="Checkout" onPress={() => router.push('/checkout')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  footer: {
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
