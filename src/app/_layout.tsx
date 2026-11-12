import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { FlyToCartProvider } from '@/animation/FlyToCart';
import { CartIcon } from '@/features/cart/CartIcon';
import { colors } from '@/theme';

const renderCartIcon = () => <CartIcon />;

export default function RootLayout() {
  return (
    <FlyToCartProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.primary,
          headerTitleStyle: { color: colors.text },
          contentStyle: { backgroundColor: colors.background },
          headerRight: renderCartIcon,
          // Chevron only — iOS otherwise repeats the previous screen's title on the back button.
          headerBackButtonDisplayMode: 'minimal',
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Book Nook' }} />
        <Stack.Screen name="book/[id]" options={{ title: 'Book' }} />
        <Stack.Screen name="cart" options={{ title: 'Your cart', headerRight: undefined }} />
        <Stack.Screen name="checkout" options={{ title: 'Checkout', headerRight: undefined }} />
        <Stack.Screen
          name="order-confirmation"
          // Full-screen success page: no header, and no swiping back into a paid checkout.
          options={{ headerShown: false, gestureEnabled: false }}
        />
      </Stack>
    </FlyToCartProvider>
  );
}
