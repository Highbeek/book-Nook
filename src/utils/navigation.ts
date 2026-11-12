import { useNavigation, type NativeStackNavigationProp } from 'expo-router';

type StackNavigation = NativeStackNavigationProp<Record<string, object | undefined>>;

/**
 * Replaces the whole stack with a fresh instance of `routeName`. Because the new screen wasn't on
 * the stack, the native stack animates it in like a push, and "back" can't return to old screens.
 *
 * Expo Router's RESET only accepts a complete navigation state (key, routeNames, routeKeySeq,
 * stale: false); a partial `{ index, routes }` payload is ignored. So the current state is reused
 * and only the routes are swapped. The new route has no key, so the router mints one.
 */
export function resetStackTo(navigation: StackNavigation, routeName: string) {
  const state = navigation.getState();
  navigation.reset({
    ...state,
    index: 0,
    routes: [{ name: routeName } as (typeof state.routes)[number]],
  });
}

/** `resetStackTo` bound to the current screen's stack: `const resetStack = useResetStack();`. */
export function useResetStack() {
  const navigation = useNavigation<StackNavigation>();
  return (routeName: string) => resetStackTo(navigation, routeName);
}
