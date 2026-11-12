import { useEffect, useRef, type ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

export interface PulseOnChangeProps {
  value: unknown;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function PulseOnChange({ value, children, style }: PulseOnChangeProps) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const previous = useRef(value);

  useEffect(() => {
    if (Object.is(previous.current, value)) return;
    previous.current = value;
    if (reduceMotion) return;
    scale.set(
      withSequence(
        withTiming(1.15, { duration: 110 }),
        withSpring(1, { damping: 12, stiffness: 260 }),
      ),
    );
  }, [value, reduceMotion, scale]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}
