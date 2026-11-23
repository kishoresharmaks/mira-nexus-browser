import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CuratedPage, Shortcut } from '@/types';
import { curatedShortDate, getDailyPage } from '@/lib/curation';
import { DEFAULT_SHORTCUTS, normalizeShortcuts } from '@/lib/shortcuts';
import { STORAGE_KEYS } from '@/lib/storage-keys';

export type WidgetSnapshot = {
  page: CuratedPage | null;
  dateLabel: string;
  shortcuts: Shortcut[];
};

/**
 * A widget render runs in a headless task, outside the app's providers. It
 * reads the same validated store the app writes, so a corrupted value can
 * never end up drawn on the home screen.
 */
export async function loadWidgetSnapshot(): Promise<WidgetSnapshot> {
  let shortcuts = DEFAULT_SHORTCUTS;

  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.shortcuts);
    if (raw != null) shortcuts = normalizeShortcuts(JSON.parse(raw));
  } catch {
    // A missing or unreadable store simply means no shortcut shelf.
  }

  return {
    page: getDailyPage(),
    dateLabel: curatedShortDate(),
    shortcuts: shortcuts.slice(0, 3),
  };
}
