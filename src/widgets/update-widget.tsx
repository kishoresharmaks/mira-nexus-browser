import { Platform } from 'react-native';
import { requestWidgetUpdate } from 'react-native-android-widget';
import type { Shortcut } from '@/types';
import { MiraWidget } from './MiraWidget';
import { loadWidgetSnapshot } from './widget-data';

export const WIDGET_NAME = 'Mira';

/**
 * Ask Android to redraw every placed Mira widget. Called when shortcuts change
 * and when the app returns to the foreground, so the calendar day can roll
 * over without waiting for the 30-minute platform tick.
 *
 * Failures are swallowed on purpose: the widget is a convenience, and a
 * launcher that has no widgets (or a platform without the module) must never
 * interrupt browsing.
 */
export async function refreshMiraWidget(
  shortcuts?: Shortcut[],
): Promise<void> {
  if (Platform.OS !== 'android') return;

  try {
    const data = await loadWidgetSnapshot();
    const snapshot = shortcuts ? { ...data, shortcuts: shortcuts.slice(0, 3) } : data;

    await requestWidgetUpdate({
      widgetName: WIDGET_NAME,
      renderWidget: (info) => ({
        light: (
          <MiraWidget
            page={snapshot.page}
            dateLabel={snapshot.dateLabel}
            shortcuts={snapshot.shortcuts}
            theme="light"
            height={info.height}
          />
        ),
        dark: (
          <MiraWidget
            page={snapshot.page}
            dateLabel={snapshot.dateLabel}
            shortcuts={snapshot.shortcuts}
            theme="dark"
            height={info.height}
          />
        ),
      }),
    });
  } catch {
    // See above: never surface widget failures to the browser.
  }
}
