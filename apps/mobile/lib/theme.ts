/**
 * Theme System
 * Centralized theme configuration and propagation
 */

import { useColorScheme } from 'react-native';

export interface ThemeColors {
  // Brand colors
  primary: string;
  accent: string;
  danger: string;
  success: string;
  
  // Background colors
  background: string;
  surface: string;
  card: string;
  
  // Text colors
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  
  // Border colors
  border: string;
  borderLight: string;
  
  // Status colors
  warning: string;
  info: string;
}

/**
 * Dark theme (default)
 */
export const darkTheme: ThemeColors = {
  primary: '#4FF0E6',
  accent: '#8A4FFF',
  danger: '#FF4F4F',
  success: '#4FF08B',
  background: '#0D1117',
  surface: '#161B22',
  card: '#1C2128',
  textPrimary: '#E6EDF3',
  textSecondary: '#9BA7B4',
  textMuted: '#6E7681',
  border: '#30363D',
  borderLight: '#21262D',
  warning: '#FFA500',
  info: '#5CE0E6',
};

/**
 * Light theme
 */
export const lightTheme: ThemeColors = {
  primary: '#4FF0E6',
  accent: '#8A4FFF',
  danger: '#FF4F4F',
  success: '#4FF08B',
  background: '#FFFFFF',
  surface: '#F6F8FA',
  card: '#FFFFFF',
  textPrimary: '#0D1117',
  textSecondary: '#656D76',
  textMuted: '#8B949E',
  border: '#D0D7DE',
  borderLight: '#F0F0F0',
  warning: '#FFA500',
  info: '#5CE0E6',
};

/**
 * Get current theme based on system preference
 */
export function useTheme(): ThemeColors {
  const colorScheme = useColorScheme();
  return colorScheme === 'light' ? lightTheme : darkTheme;
}

/**
 * Get theme colors (non-hook version)
 */
export function getTheme(isDark: boolean = true): ThemeColors {
  return isDark ? darkTheme : lightTheme;
}

/**
 * Theme context provider (if needed for manual theme switching)
 */
export const theme = {
  dark: darkTheme,
  light: lightTheme,
  current: darkTheme, // Default to dark
};

/**
 * Spacing scale
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

/**
 * Border radius scale
 */
export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
};

/**
 * Typography scale
 */
export const typography = {
  xs: { fontSize: 12, lineHeight: 16 },
  sm: { fontSize: 14, lineHeight: 20 },
  base: { fontSize: 16, lineHeight: 24 },
  lg: { fontSize: 18, lineHeight: 28 },
  xl: { fontSize: 20, lineHeight: 28 },
  '2xl': { fontSize: 24, lineHeight: 32 },
  '3xl': { fontSize: 30, lineHeight: 36 },
  '4xl': { fontSize: 36, lineHeight: 44 },
};

/**
 * Shadow presets
 */
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};
