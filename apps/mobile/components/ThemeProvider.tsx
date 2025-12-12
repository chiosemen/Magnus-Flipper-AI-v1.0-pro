/**
 * Theme Provider
 * Provides theme context throughout the app
 */

import { createContext, useContext, ReactNode } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useTheme, darkTheme, lightTheme, type ThemeColors } from '@/lib/theme';

interface ThemeContextValue {
  theme: ThemeColors;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  forceDark?: boolean;
}

/**
 * Theme provider component (enhanced with persistence)
 */
export function ThemeProvider({ children, forceDark }: ThemeProviderProps) {
  const systemTheme = useTheme();
  const isDark = forceDark !== undefined ? forceDark : systemTheme === darkTheme;
  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDark }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access theme
 */
export function useThemeContext(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within ThemeProvider');
  }
  return context;
}
