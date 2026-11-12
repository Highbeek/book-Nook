import type { ComponentRef, RefObject } from 'react';
import type { View } from 'react-native';

export type ViewHandle = ComponentRef<typeof View>;
export type ViewRef = RefObject<ViewHandle | null>;
