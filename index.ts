/**
 * Custom entry point. Expo Router normally boots from `expo-router/entry`;
 * Nexus needs one extra registration so the Android launcher can ask the app
 * to draw its home-screen widget.
 *
 * The widget task runs headless (no React tree), and the native module is not
 * part of Expo Go, so registration is skipped there.
 */
import 'expo-router/entry';
import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';
import { registerWidgetTaskHandler } from 'react-native-android-widget';
import { widgetTaskHandler } from './src/widgets/widget-task-handler';

if (Platform.OS === 'android' && !isRunningInExpoGo()) {
  registerWidgetTaskHandler(widgetTaskHandler);
}
