import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

function fire(action: () => Promise<void>) {
  if (Platform.OS === 'web') return;
  action().catch(() => {});
}

export const haptic = {
  tap: () => fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  bump: () => fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  select: () => fire(() => Haptics.selectionAsync()),
  success: () =>
    fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  warn: () => fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
};
