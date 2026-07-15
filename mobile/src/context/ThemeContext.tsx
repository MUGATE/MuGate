import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkColors, lightColors, ThemeColors } from '../theme/colors';

export type Scheme = 'light' | 'dark';

const THEME_KEY = 'mugate_theme';

type ThemeContextValue = {
  scheme: Scheme;
  colors: ThemeColors;
  toggleTheme: () => void;
  setScheme: (scheme: Scheme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const deviceScheme = useColorScheme();
  const [scheme, setSchemeState] = useState<Scheme>(deviceScheme === 'light' ? 'light' : 'dark');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_KEY);
        if (stored === 'light' || stored === 'dark') {
          setSchemeState(stored);
        }
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  const setScheme = useCallback((next: Scheme) => {
    setSchemeState(next);
    AsyncStorage.setItem(THEME_KEY, next).catch(() => undefined);
  }, []);

  const toggleTheme = useCallback(() => {
    setSchemeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      AsyncStorage.setItem(THEME_KEY, next).catch(() => undefined);
      return next;
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      scheme,
      colors: scheme === 'dark' ? darkColors : lightColors,
      toggleTheme,
      setScheme,
    }),
    [scheme, toggleTheme, setScheme]
  );

  // Avoid a theme flash before the persisted choice is loaded.
  if (!hydrated) return null;

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
