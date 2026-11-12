import type { ComponentRef, RefObject } from 'react';
import type { View } from 'react-native';

/** Instance type of a host <View> (RN's ReactNativeElement): has measureInWindow etc. */
export type ViewHandle = ComponentRef<typeof View>;
export type ViewRef = RefObject<ViewHandle | null>;
