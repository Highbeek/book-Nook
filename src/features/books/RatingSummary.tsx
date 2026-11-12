import { StyleSheet, View } from 'react-native';

import type { BookRating, StarValue } from '@/api/types';
import { colors, radius, spacing } from '@/theme';
import { AppText } from '@/components/AppText';

const STARS_DESC: StarValue[] = [5, 4, 3, 2, 1];

function starString(average: number): string {
  const filled = Math.round(average);
  return '★'.repeat(filled) + '☆'.repeat(5 - filled);
}

const plural = (n: number, word: string) =>
  `${n.toLocaleString('en-NG')} ${word}${n === 1 ? '' : 's'}`;

export function RatingSummary({ rating }: { rating: BookRating | null }) {
  if (!rating) {
    return <AppText tone="muted">No reader ratings yet.</AppText>;
  }

  const average = rating.average.toFixed(1);
  const max = Math.max(...STARS_DESC.map((star) => rating.distribution[star]), 1);

  return (
    <View style={styles.container}>
      <View
        style={styles.headline}
        accessible
        aria-label={`Rated ${average} out of 5 from ${plural(rating.count, 'rating')}`}
      >
        <AppText variant="display">{average}</AppText>
        <View>
          <AppText variant="title" tone="accent" style={styles.stars}>
            {starString(rating.average)}
          </AppText>
          <AppText variant="caption" tone="muted">
            {plural(rating.count, 'rating')}
          </AppText>
        </View>
      </View>

      {STARS_DESC.map((star) => {
        const n = rating.distribution[star];
        return (
          <View
            key={star}
            style={styles.row}
            accessible
            aria-label={`${plural(star, 'star')}: ${plural(n, 'rating')}`}
          >
            <AppText variant="caption" tone="muted" style={styles.rowLabel}>
              {star}★
            </AppText>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${(n / max) * 100}%` }]} />
            </View>
            <AppText variant="caption" tone="muted" align="right" style={styles.rowCount}>
              {n.toLocaleString('en-NG')}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  headline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  stars: { letterSpacing: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rowLabel: { width: 28 },
  track: {
    flex: 1,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.accent },
  rowCount: { width: 40 },
});
