import { useCallback, useEffect, useState } from 'react';
import { AppState, type AppStateStatus, Linking, Platform } from 'react-native';
import { Camera } from 'expo-camera';
import { requireOptionalNativeModule } from 'expo-modules-core';
import type { IconName } from '@/components/Icon';

export type PermissionStatus =
  | 'granted'
  | 'denied'
  | 'blocked'
  | 'not-declared'
  | 'install-time'
  | 'restricted'
  | 'not-applicable'
  | 'unsupported';

export type PermissionCategory =
  | 'Hardware & Media'
  | 'Network'
  | 'Advertising & Identity'
  | 'Hardware'
  | 'System & Storage';

export interface PermissionRegistryItem {
  id: string;
  androidPermission: string;
  name: string;
  category: PermissionCategory;
  feature: string;
  icon: IconName;
  inManifest: boolean;
  runtimeConsent: boolean;
  installTime: boolean;
  isEssential: boolean;
  explanation: string;
  status: PermissionStatus;
}

const NativeSpeechRecognition: any =
  Platform.OS !== 'web' ? requireOptionalNativeModule('ExpoSpeechRecognition') : null;

export const STATIC_PERMISSION_REGISTRY: Omit<PermissionRegistryItem, 'status'>[] = [
  {
    id: 'camera',
    androidPermission: 'android.permission.CAMERA',
    name: 'Camera',
    category: 'Hardware & Media',
    feature: 'QR Code & Web Link Scanner',
    icon: 'qr',
    inManifest: true,
    runtimeConsent: true,
    installTime: false,
    isEssential: false,
    explanation: 'Used exclusively when you tap the QR Scanner icon to scan web links and QR codes. Never used in the background.',
  },
  {
    id: 'microphone',
    androidPermission: 'android.permission.RECORD_AUDIO',
    name: 'Microphone',
    category: 'Hardware & Media',
    feature: 'Voice Search & Dictation',
    icon: 'mic',
    inManifest: true,
    runtimeConsent: true,
    installTime: false,
    isEssential: false,
    explanation: 'Used exclusively when you tap the microphone button to dictate search queries. Audio is never recorded or streamed when inactive.',
  },
  {
    id: 'internet',
    androidPermission: 'android.permission.INTERNET',
    name: 'Internet Access',
    category: 'Network',
    feature: 'Web Browsing & Engine Catalog',
    icon: 'globe',
    inManifest: true,
    runtimeConsent: false,
    installTime: true,
    isEssential: true,
    explanation: 'Granted by Android at installation. Required to fetch webpages, search suggestions, and remote search provider catalogs.',
  },
  {
    id: 'vibrate',
    androidPermission: 'android.permission.VIBRATE',
    name: 'Vibration / Haptics',
    category: 'Hardware',
    feature: 'Tactile Haptic Feedback',
    icon: 'sparkle',
    inManifest: true,
    runtimeConsent: false,
    installTime: true,
    isEssential: false,
    explanation: 'Granted by Android at installation for subtle haptic feedback during navigation gestures and button taps.',
  },
  {
    id: 'ad_id',
    androidPermission: 'com.google.android.gms.permission.AD_ID',
    name: 'Google Advertising ID',
    category: 'Advertising & Identity',
    feature: 'Home Screen Ad Attribution',
    icon: 'shield',
    inManifest: true,
    runtimeConsent: false,
    installTime: true,
    isEssential: false,
    explanation: 'Used by Google Mobile Ads SDK for home screen banner measurement. Can be reset or deleted in Android OS Settings > Google > Ads.',
  },
  {
    id: 'location',
    androidPermission: 'android.permission.ACCESS_FINE_LOCATION',
    name: 'GPS Location',
    category: 'Hardware & Media',
    feature: 'Blocked by Policy',
    icon: 'pin',
    inManifest: false,
    runtimeConsent: true,
    installTime: false,
    isEssential: false,
    explanation: 'Strictly stripped from Android manifest. Nexus Browser and visited websites have zero access to your physical coordinates.',
  },
  {
    id: 'contacts',
    androidPermission: 'android.permission.READ_CONTACTS',
    name: 'Device Contacts',
    category: 'System & Storage',
    feature: 'Blocked by Policy',
    icon: 'book',
    inManifest: false,
    runtimeConsent: true,
    installTime: false,
    isEssential: false,
    explanation: 'Strictly stripped from Android manifest. The browser never inspects your address book or contact entries.',
  },
  {
    id: 'storage',
    androidPermission: 'android.permission.READ_EXTERNAL_STORAGE',
    name: 'Device File Storage',
    category: 'System & Storage',
    feature: 'Blocked by Policy',
    icon: 'folder',
    inManifest: false,
    runtimeConsent: true,
    installTime: false,
    isEssential: false,
    explanation: 'Strictly stripped from Android manifest. Web pages have zero access to your photos, downloads, or external SD card.',
  },
  {
    id: 'notifications',
    androidPermission: 'android.permission.POST_NOTIFICATIONS',
    name: 'Push Notifications',
    category: 'System & Storage',
    feature: 'Blocked by Policy',
    icon: 'mask',
    inManifest: false,
    runtimeConsent: true,
    installTime: false,
    isEssential: false,
    explanation: 'Strictly stripped from Android manifest. Web pages cannot send unsolicited system push alerts or background spam.',
  },
];

/**
 * Inspects real runtime permission state for Camera via expo-camera.
 */
export async function checkCameraPermission(): Promise<PermissionStatus> {
  if (Platform.OS === 'web') return 'unsupported';
  try {
    const res = await Camera.getCameraPermissionsAsync();
    if ((res.status as string) === 'restricted') return 'restricted';
    if (res.granted) return 'granted';
    if (!res.canAskAgain) return 'blocked';
    return 'denied';
  } catch {
    return 'unsupported';
  }
}

/**
 * Inspects real runtime permission state for Microphone via native speech recognition or audio module.
 */
export async function checkMicrophonePermission(): Promise<PermissionStatus> {
  if (Platform.OS === 'web') return 'unsupported';
  if (!NativeSpeechRecognition || !NativeSpeechRecognition.getPermissionsAsync) {
    return 'unsupported';
  }
  try {
    const res = await NativeSpeechRecognition.getPermissionsAsync();
    if ((res.status as string) === 'restricted') return 'restricted';
    if (res.granted) return 'granted';
    if (!res.canAskAgain) return 'blocked';
    return 'denied';
  } catch {
    return 'unsupported';
  }
}

/**
 * Requests Camera permission interactively.
 */
export async function requestCameraPermission(): Promise<PermissionStatus> {
  if (Platform.OS === 'web') return 'unsupported';
  try {
    const res = await Camera.requestCameraPermissionsAsync();
    if ((res.status as string) === 'restricted') return 'restricted';
    if (res.granted) return 'granted';
    if (!res.canAskAgain) return 'blocked';
    return 'denied';
  } catch {
    return 'unsupported';
  }
}

/**
 * Requests Microphone permission interactively.
 */
export async function requestMicrophonePermission(): Promise<PermissionStatus> {
  if (Platform.OS === 'web') return 'unsupported';
  if (!NativeSpeechRecognition || !NativeSpeechRecognition.requestPermissionsAsync) {
    return 'unsupported';
  }
  try {
    const res = await NativeSpeechRecognition.requestPermissionsAsync();
    if ((res.status as string) === 'restricted') return 'restricted';
    if (res.granted) return 'granted';
    if (!res.canAskAgain) return 'blocked';
    return 'denied';
  } catch {
    return 'unsupported';
  }
}

/**
 * Opens Android system settings for this application.
 */
export async function openSystemSettings(): Promise<void> {
  try {
    await Linking.openSettings();
  } catch {
    // fallback
  }
}

/**
 * Checks all registered permissions and returns their current live status.
 */
export async function checkAllPermissions(): Promise<PermissionRegistryItem[]> {
  const [cameraStatus, micStatus] = await Promise.all([
    checkCameraPermission(),
    checkMicrophonePermission(),
  ]);

  return STATIC_PERMISSION_REGISTRY.map((item) => {
    if (item.id === 'camera') {
      return { ...item, status: cameraStatus };
    }
    if (item.id === 'microphone') {
      return { ...item, status: micStatus };
    }
    if (item.installTime) {
      return { ...item, status: 'install-time' as PermissionStatus };
    }
    if (!item.inManifest) {
      return { ...item, status: 'not-declared' as PermissionStatus };
    }
    return { ...item, status: 'granted' as PermissionStatus };
  });
}

/**
 * Central hook for dynamic Android permission management.
 * Automatically refreshes when the app transitions back to 'active' state
 * (such as when the user returns from Android OS Settings).
 */
export function usePermissionManager() {
  const [permissions, setPermissions] = useState<PermissionRegistryItem[]>(() =>
    STATIC_PERMISSION_REGISTRY.map((item) => ({
      ...item,
      status: item.installTime
        ? 'install-time'
        : !item.inManifest
          ? 'not-declared'
          : 'denied',
    })),
  );
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const live = await checkAllPermissions();
      setPermissions(live);
    } catch {
      // keep existing state on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();

    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        void refresh();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [refresh]);

  const request = useCallback(
    async (id: string): Promise<PermissionStatus> => {
      let nextStatus: PermissionStatus = 'unsupported';
      if (id === 'camera') {
        nextStatus = await requestCameraPermission();
      } else if (id === 'microphone') {
        nextStatus = await requestMicrophonePermission();
      }
      await refresh();
      return nextStatus;
    },
    [refresh],
  );

  const runtimePermissions = permissions.filter((p) => p.runtimeConsent && p.inManifest);
  const installTimePermissions = permissions.filter((p) => p.installTime && p.inManifest);
  const blockedPermissions = permissions.filter((p) => !p.inManifest);

  return {
    permissions,
    runtimePermissions,
    installTimePermissions,
    blockedPermissions,
    loading,
    refresh,
    request,
    openSettings: openSystemSettings,
  };
}
