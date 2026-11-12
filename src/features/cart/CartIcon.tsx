import { useRouter } from 'expo-router';
import { useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { useCartTarget } from '@/animation/FlyToCart';
import { colors } from '@/theme';
import type { ViewHandle } from '@/utils/refs';

import { selectItemCount, useCartStore } from './cartStore';

export function CartIcon() {
  const count = useCartStore(selectItemCount);
  const router = useRouter();
  const ref = useRef<ViewHandle>(null);
  const bumpStyle = useCartTarget(ref);

  const label = count === 0 ? 'Cart, empty' : `Cart, ${count} ${count === 1 ? 'item' : 'items'}`;

  return (
    <Pressable
      role="button"
      aria-label={label}
      hitSlop={10}
      onPress={() => router.push('/cart')}
      testID="cart-icon"
    >
      <Animated.View ref={ref} collapsable={false} style={[styles.icon, bumpStyle]}>
        <Text style={styles.glyph}>🛒</Text>
        {count > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText} testID="cart-badge">
              {count > 99 ? '99+' : count}
            </Text>
          </View>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  icon: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  glyph: { fontSize: 22 },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: colors.onPrimary, fontSize: 11, fontWeight: '700' },
});
