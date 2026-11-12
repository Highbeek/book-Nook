import { useNavigation, type NativeStackNavigationProp } from 'expo-router';

type StackNavigation = NativeStackNavigationProp<Record<string, object | undefined>>;

export function resetStackTo(navigation: StackNavigation, routeName: string) {
  const state = navigation.getState();
  navigation.reset({
    ...state,
    index: 0,
    routes: [{ name: routeName } as (typeof state.routes)[number]],
  });
}

export function useResetStack() {
  const navigation = useNavigation<StackNavigation>();
  return (routeName: string) => resetStackTo(navigation, routeName);
}
