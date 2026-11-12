import { useEffect, type ReactNode } from 'react';
import {
  StyleSheet,
  View,
  type DimensionValue,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { colors, radius as radii } from '@/theme';

export interface SkeletonProps {
  label: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({ label, children, style }: SkeletonProps) {
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) return;
    opacity.set(
      withRepeat(withTiming(0.45, { duration: 800, easing: Easing.inOut(Easing.ease) }), -1, true),
    );
  }, [reduceMotion, opacity]);

  const pulseStyle = useAnimatedStyle(() => ({ opacity: opacity.get() }));

  return (
    <Animated.View
      accessible
      role="progressbar"
      aria-label={label}
      aria-busy
      style={[style, pulseStyle]}
    >
      {children}
    </Animated.View>
  );
}

export interface BoneProps {
  width?: DimensionValue;
  height: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

export function Bone({ width = '100%', height, radius = radii.sm, style }: BoneProps) {
  return <View style={[styles.bone, { width, height, borderRadius: radius }, style]} />;
}

const styles = StyleSheet.create({
  bone: { backgroundColor: colors.border },
});
