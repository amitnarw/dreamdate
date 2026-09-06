import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  AppTheme,
  DaylightEleganceTheme,
  MidnightEleganceTheme,
} from '../constants/theme';

export type ThemeMode = 'dark' | 'light';

interface ThemeContextType {
  themeMode: ThemeMode;
  isDark: boolean;
  theme: AppTheme;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const THEME_STORAGE_KEY = '@dreamdate_theme_mode';

export const ThemeContext = createContext<ThemeContextType>({
  themeMode: 'dark',
  isDark: true,
  theme: MidnightEleganceTheme,
  toggleTheme: () => {},
  setThemeMode: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('dark');

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((saved) => {
        if (saved === 'light' || saved === 'dark') {
          setThemeModeState(saved);
        }
      })
      .catch(() => {});
  }, []);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    AsyncStorage.setItem(THEME_STORAGE_KEY, mode).catch(() => {});
  };

  const toggleTheme = () => {
    setThemeModeState((prev) => {
      const next: ThemeMode = prev === 'dark' ? 'light' : 'dark';
      AsyncStorage.setItem(THEME_STORAGE_KEY, next).catch(() => {});
      return next;
    });
  };

  const isDark = themeMode === 'dark';
  const theme: AppTheme = isDark ? MidnightEleganceTheme : (DaylightEleganceTheme as any);

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        isDark,
        theme,
        toggleTheme,
        setThemeMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
