/**
 * Minimal Reanimated test double.
 *
 * Reanimated 4.7's bundled `mock` boots its real runtime, which needs native modules (and DOM
 * APIs on the JS fallback) that Jest doesn't have. The app only uses a small surface, so we
 * stub exactly that: animations resolve instantly to their target value, and animated
 * components render as plain host components. Animation *timing* is not unit-tested; the
 * cart state the animation decorates is.
 */
import type { ComponentType } from 'react';
import { Image, ScrollView, Text, View } from 'react-native';

type AnimationCallback = (finished: boolean) => void;

const identity = <T,>(v: T) => v;

// React 19: `ref` is an ordinary prop, so it flows through `props` without forwardRef.
function createAnimatedComponent<P extends object>(Component: ComponentType<P>) {
  return function AnimatedComponent(props: P) {
    return <Component {...props} />;
  };
}

const Animated = {
  View: createAnimatedComponent(View),
  Text: createAnimatedComponent(Text),
  Image: createAnimatedComponent(Image),
  ScrollView: createAnimatedComponent(ScrollView),
  createAnimatedComponent,
};

export default Animated;
export { createAnimatedComponent };

export function useSharedValue<T>(initial: T) {
  const sv = {
    value: initial,
    get: () => sv.value,
    set: (next: T | ((prev: T) => T)) => {
      sv.value = typeof next === 'function' ? (next as (p: T) => T)(sv.value) : next;
    },
  };
  return sv;
}

export const useAnimatedStyle = <T,>(factory: () => T) => factory();
export const useReducedMotion = () => false;

export function withTiming<T>(toValue: T, _config?: unknown, callback?: AnimationCallback) {
  callback?.(true);
  return toValue;
}
export function withSpring<T>(toValue: T, _config?: unknown, callback?: AnimationCallback) {
  callback?.(true);
  return toValue;
}
export const withSequence = <T,>(...values: T[]) => values[values.length - 1];

export function interpolate(value: number, input: number[], output: number[]) {
  // Linear interpolation, clamped — enough for style computation in tests.
  if (value <= input[0]) return output[0];
  for (let i = 1; i < input.length; i++) {
    if (value <= input[i]) {
      const t = (value - input[i - 1]) / (input[i] - input[i - 1]);
      return output[i - 1] + t * (output[i] - output[i - 1]);
    }
  }
  return output[output.length - 1];
}

export const Easing = {
  bezier: () => identity,
  linear: identity,
  ease: identity,
  inOut: () => identity,
  out: () => identity,
  in: () => identity,
};
