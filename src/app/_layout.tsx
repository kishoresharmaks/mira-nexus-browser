import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { isRunningInExpoGo } from 'expo';
import { useFonts } from 'expo-font';
import { NavigationBar } from 'expo-navigation-bar';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { InstrumentSans_400Regular } from '@expo-google-fonts/instrument-sans/400Regular';
import { InstrumentSans_500Medium } from '@expo-google-fonts/instrument-sans/500Medium';
import { InstrumentSans_600SemiBold } from '@expo-google-fonts/instrument-sans/600SemiBold';
import { InstrumentSans_700Bold } from '@expo-google-fonts/instrument-sans/700Bold';
import { InstrumentSerif_400Regular } from '@expo-google-fonts/instrument-serif/400Regular';
import { InstrumentSerif_400Regular_Italic } from '@expo-google-fonts/instrument-serif/400Regular_Italic';
import { LaunchScreen } from '@/components/LaunchScreen';
import { ToastProvider } from '@/components/Toast';
import { AdsProvider } from '@/lib/ads-provider';
import { CatalogProvider, useCatalogConfig } from '@/lib/catalog-provider';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';

SplashScreen.preventAutoHideAsync().catch(() => {});
// Splash options are only honoured by development/production builds; Expo Go
// warns and ignores them.
if (!isRunningInExpoGo()) {
  SplashScreen.setOptions({ duration: 320, fade: true });
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    InstrumentSerif: InstrumentSerif_400Regular,
    InstrumentSerifItalic: InstrumentSerif_400Regular_Italic,
    InstrumentSans: InstrumentSans_400Regular,
    InstrumentSansMedium: InstrumentSans_500Medium,
    InstrumentSansSemiBold: InstrumentSans_600SemiBold,
    InstrumentSansBold: InstrumentSans_700Bold,
  });

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <CatalogProvider>
          <AdsProvider>
            <ToastProvider>
              <Startup>
                <Navigator />
              </Startup>
            </ToastProvider>
          </AdsProvider>
        </CatalogProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function Startup({ children }: { children: ReactNode }) {
  const { hydrated: themeReady } = useTheme();
  const { hydrated: catalogReady } = useCatalogConfig();
  const [splashHidden, setSplashHidden] = useState(false);
  const [ready, setReady] = useState(false);
  const [launchDone, setLaunchDone] = useState(false);
  const shownAt = useRef<number | null>(null);
  const hiding = useRef(false);

  // Hold the native splash until the saved theme is known. Hiding it first can
  // flash the system palette for a frame before the custom screen repaints.
  useEffect(() => {
    if (!themeReady) {
      const fallback = setTimeout(() => {
        if (hiding.current) return;
        hiding.current = true;
        shownAt.current = Date.now();
        SplashScreen.hideAsync()
          .catch(() => {})
          .finally(() => setSplashHidden(true));
      }, 1_200);
      return () => clearTimeout(fallback);
    }

    if (hiding.current) return;
    hiding.current = true;
    shownAt.current = Date.now();
    SplashScreen.hideAsync()
      .catch(() => {})
      .finally(() => setSplashHidden(true));
  }, [themeReady]);

  useEffect(() => {
    if (!splashHidden || !themeReady || !catalogReady) return;
    const elapsed = Date.now() - (shownAt.current ?? Date.now());
    const timer = setTimeout(
      () => setReady(true),
      Math.max(0, 780 - elapsed),
    );
    return () => clearTimeout(timer);
  }, [catalogReady, splashHidden, themeReady]);

  // A corrupt or wedged storage read must never trap someone on this screen.
  useEffect(() => {
    const fallback = setTimeout(() => setReady(true), 3_000);
    return () => clearTimeout(fallback);
  }, []);

  const finish = useCallback(() => setLaunchDone(true), []);

  return (
    <View style={styles.root}>
      {children}
      {!launchDone ? (
        <LaunchScreen ready={ready} onFinish={finish} />
      ) : null}
    </View>
  );
}

function Navigator() {
  const { theme, mode } = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      {Platform.OS === 'android' ? (
        <NavigationBar style={mode === 'dark' ? 'dark' : 'light'} />
      ) : null}
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none',
          contentStyle: { backgroundColor: theme.bg },
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
