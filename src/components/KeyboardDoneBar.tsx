import { InputAccessoryView, Keyboard, Platform, Pressable, StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/theme';
import { AppText } from './AppText';

/**
 * A "Done" bar above the iOS keyboard. iOS number pads have no return key, so without this
 * there's no obvious way to close them. Point inputs at it with `inputAccessoryViewID={nativeID}`.
 * Android keyboards always have a submit key (and the back button), so this renders nothing there.
 */
export function KeyboardDoneBar({ nativeID }: { nativeID: string }) {
  if (Platform.OS !== 'ios') return null;
  return (
    <InputAccessoryView nativeID={nativeID}>
      <View style={styles.bar}>
        <Pressable
          role="button"
          aria-label="Close keyboard"
          onPress={() => Keyboard.dismiss()}
          hitSlop={10}
        >
          <AppText tone="primary" weight="semibold">
            Done
          </AppText>
        </Pressable>
      </View>
    </InputAccessoryView>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceMuted,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
