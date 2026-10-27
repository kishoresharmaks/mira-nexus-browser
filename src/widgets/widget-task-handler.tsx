import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { MiraWidget } from './MiraWidget';
import { loadWidgetSnapshot } from './widget-data';

/**
 * Runs in a headless JS context when the launcher adds, resizes, or ticks a
 * Mira widget. It must not touch React state, navigation, or the theme
 * provider; everything it draws comes from validated local storage.
 */
export async function widgetTaskHandler(
  props: WidgetTaskHandlerProps,
): Promise<void> {
  const { widgetAction, widgetInfo, renderWidget } = props;

  if (widgetAction === 'WIDGET_DELETED') return;
  if (widgetInfo.widgetName !== 'Mira') return;

  if (
    widgetAction !== 'WIDGET_ADDED' &&
    widgetAction !== 'WIDGET_UPDATE' &&
    widgetAction !== 'WIDGET_RESIZED'
  ) {
    return;
  }

  const snapshot = await loadWidgetSnapshot();
  const height = widgetInfo.height;

  renderWidget({
    light: (
      <MiraWidget
        page={snapshot.page}
        dateLabel={snapshot.dateLabel}
        shortcuts={snapshot.shortcuts}
        theme="light"
        height={height}
      />
    ),
    dark: (
      <MiraWidget
        page={snapshot.page}
        dateLabel={snapshot.dateLabel}
        shortcuts={snapshot.shortcuts}
        theme="dark"
        height={height}
      />
    ),
  });
}
