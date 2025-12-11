/**
 * Theme Provider
 * Provides theme context throughout the app
 */

import { createContext, useContext, ReactNode, useEffect } from 'react';
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

  // Apply theme to root component styles
  useEffect(() => {
    // Update status bar style based on theme
    if (isDark) {
      // Dark theme - light status bar
      StatusBar.setBarStyle('light-content', true);
    } else {
      // Light theme - dark status bar
      StatusBar.setBarStyle('dark-content', true);
    }
  }, [isDark]);

  return (
    <ThemeContext.Provider value={{ theme, isDark }}>
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
