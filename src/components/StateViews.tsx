import { Image, type ImageSource } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';

import { colors, radius, spacing } from '@/theme';

import { Button } from './Button';
import { AppText } from './AppText';

export function ErrorView({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.center}>
      <AppText variant="title" align="center">
        Something went wrong
      </AppText>
      <AppText tone="muted" align="center" role="alert">
        {message}
      </AppText>
      {onRetry ? <Button label="Try again" onPress={onRetry} style={styles.action} /> : null}
    </View>
  );
}

export interface EmptyViewProps {
  title: string;
  message?: string;

  image?: ImageSource | number;
}

export function EmptyView({ title, message, image }: EmptyViewProps) {
  return (
    <View style={styles.center}>
      {image ? (
        <Animated.View entering={ZoomIn.springify().damping(14)} style={styles.halo}>
          <Image source={image} style={styles.image} contentFit="contain" accessible={false} />
        </Animated.View>
      ) : null}
      <Animated.View entering={FadeInDown.delay(120).duration(250)} style={styles.text}>
        <AppText variant="title" align="center">
          {title}
        </AppText>
        {message ? (
          <AppText tone="muted" align="center">
            {message}
          </AppText>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  action: { marginTop: spacing.md },
  text: { alignItems: 'center', gap: spacing.sm },
  halo: {
    width: 120,
    height: 120,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
    marginBottom: spacing.md,
  },
  image: { width: 64, height: 64 },
});
