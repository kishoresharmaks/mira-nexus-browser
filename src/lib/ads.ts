import { Platform } from 'react-native';
import { isRunningInExpoGo } from 'expo';
import { isAdUnitId, type AdsConfig } from '@/lib/catalog';

export type AdsModule = typeof import('react-native-google-mobile-ads');

export type BannerUnit = {
  unitId: string | null;
  testMode: boolean;
};

let modulePromise: Promise<AdsModule | null> | null = null;

/**
 * AdMob has native code on Android and iOS, but no web target, and Expo Go
 * cannot load it. Both cases degrade to "no ad" rather than a crash.
 */
export function adsAvailable(): boolean {
  return Platform.OS !== 'web' && !isRunningInExpoGo();
}

export function loadAdsModule(): Promise<AdsModule | null> {
  if (!adsAvailable()) return Promise.resolve(null);
  if (!modulePromise) {
    // Loaded lazily so the browser bundle never evaluates the native module.
    modulePromise = import('react-native-google-mobile-ads').catch(() => null);
  }
  return modulePromise;
}

/**
 * Development builds and test mode always request Google's test creative. A
 * live placement with no valid unit for this platform simply disappears.
 */
export function resolveBannerUnit(
  module: AdsModule,
  ads: AdsConfig,
): BannerUnit {
  const testMode = __DEV__ || ads.testMode;
  if (testMode) {
    return { unitId: module.TestIds.ADAPTIVE_BANNER, testMode: true };
  }

  const configured =
    Platform.OS === 'ios' ? ads.iosUnitId : ads.androidUnitId;
  return {
    unitId: isAdUnitId(configured) ? configured : null,
    testMode: false,
  };
}

export async function requestTrackingPermission(): Promise<void> {
  try {
    const tracking = await import('expo-tracking-transparency');
    await tracking.requestTrackingPermissionsAsync();
  } catch {
    // ATT is unavailable on Android, in Expo Go, and in some simulators. Ads
    // can still request non-personalized inventory without it.
  }
}
