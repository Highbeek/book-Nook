import { StyleSheet, View } from 'react-native';

import { Bone, Skeleton } from '@/components/Skeleton';
import { colors, radius, spacing } from '@/theme';

import { BOOK_ROW_HEIGHT, COVER_HEIGHT, COVER_WIDTH } from './BookRow';

const ROWS = 6;

export function BookListSkeleton({ label }: { label: string }) {
  return (
    <Skeleton label={label} style={styles.list}>
      {Array.from({ length: ROWS }, (_, i) => (
        <View key={i} style={styles.row}>
          <Bone width={COVER_WIDTH} height={COVER_HEIGHT} radius={radius.sm} />
          <View style={styles.info}>
            <View style={styles.lines}>
              <Bone width="85%" height={14} />
              <Bone width="55%" height={14} />
              <Bone width="40%" height={10} style={styles.byline} />
            </View>
            <View style={styles.footer}>
              <Bone width={72} height={16} />
              <Bone width={64} height={28} radius={radius.pill} />
            </View>
          </View>
        </View>
      ))}
    </Skeleton>
  );
}

export function BookDetailsSkeleton({ label }: { label: string }) {
  return (
    <Skeleton label={label} style={styles.details}>
      <View style={styles.hero}>
        <Bone width={160} height={240} radius={radius.md} />
        <Bone width="70%" height={22} style={styles.title} />
        <Bone width="40%" height={14} />
        <Bone width={110} height={24} />
      </View>
      <Bone width={140} height={18} />
      {['100%', '100%', '95%', '100%', '70%'].map((width, i) => (
        <Bone key={i} width={width as `${number}%`} height={14} />
      ))}
    </Skeleton>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.surface },
  row: {
    height: BOOK_ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  info: { flex: 1, height: COVER_HEIGHT, justifyContent: 'space-between' },
  lines: { gap: spacing.sm },
  byline: { marginTop: spacing.xs },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  details: { flex: 1, padding: spacing.xl, gap: spacing.md },
  hero: { alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  title: { marginTop: spacing.md },
});
