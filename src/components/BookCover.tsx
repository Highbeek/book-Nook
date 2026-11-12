import { Image } from 'expo-image';
import { memo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { coverUrl, type CoverSize } from '@/api/books';
import { colors, radius } from '@/theme';
import { AppText } from './AppText';

export interface BookCoverProps {
  coverId: number | null;
  title: string;
  width: number;
  height: number;
  size?: CoverSize;
  style?: StyleProp<ViewStyle>;
}

function BookCoverComponent({ coverId, title, width, height, size = 'M', style }: BookCoverProps) {
  const uri = coverUrl(coverId, size);
  const box = [styles.box, { width, height }, style];

  if (!uri) {
    return (
      <View style={[box, styles.fallback]}>
        <AppText
          tone="muted"
          align="center"
          style={styles.fallbackText}
          numberOfLines={3}
          aria-hidden
        >
          {title}
        </AppText>
      </View>
    );
  }

  return (
    <View style={box}>
      <Image
        source={{ uri }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        cachePolicy="memory-disk"
        recyclingKey={uri}
        transition={150}
        accessibilityLabel={`Cover of ${title}`}
      />
    </View>
  );
}

export const BookCover = memo(BookCoverComponent);

const styles = StyleSheet.create({
  box: { borderRadius: radius.sm, overflow: 'hidden', backgroundColor: colors.surfaceMuted },
  fallback: { alignItems: 'center', justifyContent: 'center', padding: 6 },
  fallbackText: { fontSize: 10 },
});
