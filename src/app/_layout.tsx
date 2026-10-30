import { useEffect } from 'react';
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
import { ToastProvider } from '@/components/Toast';
import { CatalogProvider } from '@/lib/catalog-provider';
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

  useEffect(() => {
    if (!fontsLoaded && !fontError) return;
    const frame = requestAnimationFrame(() => {
      SplashScreen.hideAsync().catch(() => {});
    });
    return () => cancelAnimationFrame(frame);
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <CatalogProvider>
          <ToastProvider>
            <Navigator />
          </ToastProvider>
        </CatalogProvider>
      </ThemeProvider>
    </SafeAreaProvider>
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
