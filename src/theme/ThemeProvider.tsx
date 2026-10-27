import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { haptic } from '@/lib/haptics';
import { STORAGE_KEYS } from '@/lib/storage-keys';
import { themes, type Theme, type ThemeMode } from './index';

const THEME_KEY = STORAGE_KEYS.theme;

type ThemeContextValue = {
  theme: Theme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>(
    systemScheme === 'dark' ? 'dark' : 'light',
  );

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(THEME_KEY)
      .then((stored) => {
        if (!alive) return;
        if (stored === 'light' || stored === 'dark') setModeState(stored);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    haptic.select();
    AsyncStorage.setItem(THEME_KEY, next).catch(() => {});
  }, []);

  const toggleMode = useCallback(() => {
    setMode(mode === 'dark' ? 'light' : 'dark');
  }, [mode, setMode]);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme: themes[mode], mode, setMode, toggleMode }),
    [mode, setMode, toggleMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside ThemeProvider');
  return value;
}

/**
 * Paint a subtree with a different palette without changing the person's saved
 * appearance. Used by private tabs: the room is always night, but the rest of
 * Mira keeps the light or dark theme they chose.
 */
export function ThemeScope({
  theme,
  children,
}: {
  theme: Theme;
  children: ReactNode;
}) {
  const parent = useTheme();
  const { setMode, toggleMode } = parent;
  const value = useMemo<ThemeContextValue>(
    () => ({ theme, mode: theme.mode, setMode, toggleMode }),
    [theme, setMode, toggleMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
