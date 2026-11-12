import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Price } from '@/components/Price';
import { colors, font, radius, spacing } from '@/theme';
import { useResetStack } from '@/utils/navigation';
import { AppText } from '@/components/AppText';

const checkIcon = require('../../../assets/icons/check.png');

/** Staggered entrance: content rises into place one piece after another. */
const rise = (delayMs: number) => FadeInDown.delay(delayMs).springify().damping(18);

export function OrderConfirmationScreen() {
  const resetStack = useResetStack();
  const insets = useSafeAreaInsets();
  const { reference, amount, last4 } = useLocalSearchParams<{
    reference?: string;
    amount?: string;
    last4?: string;
  }>();
  const hasDetails = Boolean(amount || last4 || reference);
  const rows = [
    amount ? (
      <Row key="amount" label="Amount paid">
        <Price amount={Number(amount)} style={styles.amount} />
      </Row>
    ) : null,
    last4 ? (
      <Row key="card" label="Payment">
        <AppText weight="semibold" style={styles.value}>
          Card •••• {last4}
        </AppText>
      </Row>
    ) : null,
    reference ? (
      <Row key="ref" label="Reference">
        <AppText weight="semibold" style={[styles.value, styles.reference]} selectable>
          {reference}
        </AppText>
      </Row>
    ) : null,
  ].filter(Boolean);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <SuccessBadge />
          <Animated.View entering={rise(350)}>
            <AppText variant="display" role="heading">
              Order confirmed
            </AppText>
          </Animated.View>
          <Animated.View entering={rise(430)}>
            <AppText tone="muted" align="center" style={styles.subtitle}>
              Thanks for shopping with Book Nook. A receipt is on its way to your inbox.
            </AppText>
          </Animated.View>
        </View>

        {hasDetails ? (
          <Animated.View entering={rise(520)} style={styles.card}>
            {rows.map((row, index) => (
              <Animated.View
                key={index}
                entering={rise(600 + index * 80)}
                style={index < rows.length - 1 ? styles.rowDivider : null}
              >
                {row}
              </Animated.View>
            ))}
          </Animated.View>
        ) : null}
      </ScrollView>

      <Animated.View
        entering={rise(850)}
        style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}
      >
        {/* Forward to a fresh home screen; the paid checkout flow is cleared from history. */}
        <Button label="Continue shopping" onPress={() => resetStack('index')} />
      </Animated.View>
    </View>
  );
}

/** The check pops in on a spring, and a ring ripples out from the halo twice. */
function SuccessBadge() {
  const reduceMotion = useReducedMotion();
  const ripple = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    ripple.set(
      withDelay(
        250,
        withRepeat(withTiming(1, { duration: 1100, easing: Easing.out(Easing.quad) }), 2),
      ),
    );
  }, [reduceMotion, ripple]);

  const rippleStyle = useAnimatedStyle(() => ({
    opacity: 0.45 * (1 - ripple.get()),
    transform: [{ scale: 1 + ripple.get() * 0.6 }],
  }));

  return (
    <Animated.View entering={ZoomIn.duration(300)} style={styles.halo}>
      {reduceMotion ? null : <Animated.View style={[styles.ripple, rippleStyle]} />}
      <Animated.View entering={ZoomIn.delay(150).springify().damping(10).stiffness(180)}>
        <Image source={checkIcon} style={styles.icon} contentFit="contain" accessible={false} />
      </Animated.View>
    </Animated.View>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.row}>
      <AppText tone="muted">{label}</AppText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.xxl,
  },
  hero: { alignItems: 'center', gap: spacing.md },
  halo: {
    width: 112,
    height: 112,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E6F4E6',
    marginBottom: spacing.sm,
  },
  ripple: {
    ...StyleSheet.absoluteFill,
    borderRadius: radius.pill,
    backgroundColor: '#B9E3B9',
  },
  icon: { width: 72, height: 72 },
  subtitle: { lineHeight: 22, maxWidth: 300 },
  card: {
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  value: { flexShrink: 1 },
  amount: { fontSize: font.title, fontWeight: '700' },
  reference: { fontVariant: ['tabular-nums'], letterSpacing: 0.5 },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    backgroundColor: colors.background,
  },
});
