/**
 * Reanimated 4.7's bundled mock needs native modules Jest doesn't have, so this stubs only the
 * APIs the app uses: animations finish instantly and animated components render as plain ones.
 */
import type { ComponentType } from 'react';
import { FlatList, Image, ScrollView, Text, View } from 'react-native';

type AnimationCallback = (finished: boolean) => void;

const identity = <T,>(v: T) => v;

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
  FlatList,
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
  if (value <= input[0]) return output[0];
  for (let i = 1; i < input.length; i++) {
    if (value <= input[i]) {
      const t = (value - input[i - 1]) / (input[i] - input[i - 1]);
      return output[i - 1] + t * (output[i] - output[i - 1]);
    }
  }
  return output[output.length - 1];
}

export const withDelay = <T,>(_delayMs: number, value: T) => value;
export const withRepeat = <T,>(value: T) => value;

/** Layout-animation builders (FadeInDown.delay(…).springify()…): every call chains to itself. */
const builder: Record<string, unknown> = new Proxy({}, { get: () => () => builder });
export const FadeIn = builder;
export const FadeInDown = builder;
export const FadeOut = builder;
export const FadeOutLeft = builder;
export const LinearTransition = builder;
export const ZoomIn = builder;
export const ReduceMotion = { System: 'system', Always: 'always', Never: 'never' } as const;

export const Easing = {
  quad: identity,
  bezier: () => identity,
  linear: identity,
  ease: identity,
  inOut: () => identity,
  out: () => identity,
  in: () => identity,
};
