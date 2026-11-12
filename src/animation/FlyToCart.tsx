import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { BookCover } from '@/components/BookCover';
import type { ViewRef } from '@/utils/refs';

export const FLIGHT_DURATION_MS = 650;
const ARC_HEIGHT = 80;
const END_SCALE = 0.15;

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Flight {
  id: number;
  from: Rect;
  to: Rect;
  coverId: number | null;
  title: string;
}

export interface FlyToCartItem {
  coverId: number | null;
  title: string;
}

interface FlyToCartContextValue {
  /** Registers a cart icon as the flight target. Returns an unregister function. */
  registerTarget: (ref: ViewRef) => () => void;
  /** Launches a cover from `source` to the cart icon, then bumps the icon. */
  fly: (source: ViewRef | null, item: FlyToCartItem) => void;
  bump: SharedValue<number>;
}

const FlyToCartContext = createContext<FlyToCartContextValue | null>(null);

function measure(ref: ViewRef | null | undefined): Promise<Rect | null> {
  return new Promise((resolve) => {
    const node = ref?.current;
    if (typeof node?.measureInWindow !== 'function') return resolve(null);
    node.measureInWindow((x, y, width, height) => {
      resolve(width > 0 && height > 0 ? { x, y, width, height } : null);
    });
  });
}

function FlyingCover({ flight, onDone }: { flight: Flight; onDone: (id: number) => void }) {
  const progress = useSharedValue(0);
  const { from, to } = flight;
  const dx = to.x + to.width / 2 - (from.x + from.width / 2);
  const dy = to.y + to.height / 2 - (from.y + from.height / 2);

  useEffect(() => {
    progress.set(
      withTiming(
        1,
        { duration: FLIGHT_DURATION_MS, easing: Easing.bezier(0.45, 0, 0.25, 1) },
        (finished) => {
          if (finished) scheduleOnRN(onDone, flight.id);
        },
      ),
    );
  }, [flight.id, onDone, progress]);

  const style = useAnimatedStyle(() => {
    const p = progress.value;
    // Parabolic lift on top of the straight line gives the throw a natural arc.
    const arc = -ARC_HEIGHT * 4 * p * (1 - p);
    return {
      opacity: interpolate(p, [0, 0.85, 1], [1, 0.9, 0]),
      transform: [
        { translateX: dx * p },
        { translateY: dy * p + arc },
        { scale: interpolate(p, [0, 1], [1, END_SCALE]) },
        { rotate: `${interpolate(p, [0, 1], [0, -12])}deg` },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.flying,
        { left: from.x, top: from.y, width: from.width, height: from.height },
        style,
      ]}
    >
      <BookCover
        coverId={flight.coverId}
        title={flight.title}
        width={from.width}
        height={from.height}
      />
    </Animated.View>
  );
}

export function FlyToCartProvider({ children }: { children: ReactNode }) {
  const [flights, setFlights] = useState<Flight[]>([]);
  const targets = useRef<ViewRef[]>([]);
  const nextId = useRef(0);
  const bump = useSharedValue(1);
  const reduceMotion = useReducedMotion();
  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const bumpCart = useCallback(() => {
    bump.set(
      withSequence(
        withTiming(1.3, { duration: 120 }),
        withSpring(1, { damping: 6, stiffness: 220 }),
      ),
    );
  }, [bump]);

  const registerTarget = useCallback((ref: ViewRef) => {
    targets.current.push(ref);
    return () => {
      targets.current = targets.current.filter((t) => t !== ref);
    };
  }, []);

  const finishFlight = useCallback(
    (id: number) => {
      setFlights((current) => current.filter((f) => f.id !== id));
      bumpCart();
    },
    [bumpCart],
  );

  const fly = useCallback(
    async (source: ViewRef | null, item: FlyToCartItem) => {
      if (reduceMotion) {
        bumpCart();
        return;
      }
      // The most recently mounted cart icon belongs to the screen on top of the stack.
      const target = targets.current[targets.current.length - 1];
      const [from, measuredTo] = await Promise.all([measure(source), measure(target)]);
      if (!from) {
        bumpCart();
        return;
      }
      // Fallback: header's trailing edge, if the icon can't be measured.
      const to = measuredTo ?? { x: windowWidth - 44, y: insets.top + 8, width: 28, height: 28 };
      const id = ++nextId.current;
      setFlights((current) => [...current, { id, from, to, ...item }]);
    },
    [bumpCart, insets.top, reduceMotion, windowWidth],
  );

  const value = useMemo(() => ({ registerTarget, fly, bump }), [registerTarget, fly, bump]);

  return (
    <FlyToCartContext.Provider value={value}>
      {children}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {flights.map((flight) => (
          <FlyingCover key={flight.id} flight={flight} onDone={finishFlight} />
        ))}
      </View>
    </FlyToCartContext.Provider>
  );
}

const noop = () => {};
const fallbackContext: Omit<FlyToCartContextValue, 'bump'> = {
  registerTarget: () => noop,
  fly: noop,
};

/** Safe outside the provider (e.g. isolated component tests): animation simply doesn't run. */
export function useFlyToCart() {
  const ctx = useContext(FlyToCartContext);
  return ctx?.fly ?? fallbackContext.fly;
}

/** Wires a cart icon up as the flight target and returns its bump animation style. */
export function useCartTarget(ref: ViewRef) {
  const ctx = useContext(FlyToCartContext);
  const fallbackBump = useSharedValue(1);
  const bump = ctx?.bump ?? fallbackBump;
  const register = ctx?.registerTarget ?? fallbackContext.registerTarget;

  useEffect(() => register(ref), [register, ref]);

  return useAnimatedStyle(() => ({ transform: [{ scale: bump.value }] }));
}

const styles = StyleSheet.create({
  flying: {
    position: 'absolute',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
});
