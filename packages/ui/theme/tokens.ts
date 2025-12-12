export const colors = {
  primary: '#4FF0E6',
  accent: '#8A4FFF',
  danger: '#FF4F4F',
  success: '#4FF08B',
  warning: '#F59E0B',
  info: '#3B82F6',
  background: '#0D1117',
  surface: '#161B22',
  surfaceSubtle: '#1C2128',
  textPrimary: '#E6EDF3',
  textSecondary: '#9BA7B4',
  textMuted: '#6E7681',
  border: '#30363D',
  borderLight: '#21262D',
  // Primary shades
  primary50: '#E6FFFD',
  primary100: '#B3FFF9',
  primary200: '#80FFF5',
  primary300: '#4DF0E6',
  primary400: '#1AE0D7',
  primary500: '#4FF0E6',
  primary600: '#3DD0C6',
  primary700: '#2BB0A6',
  primary800: '#199086',
  primary900: '#077066',
  // Accent shades
  accent50: '#F3E8FF',
  accent100: '#E0C2FF',
  accent200: '#CD9CFF',
  accent300: '#BA76FF',
  accent400: '#A750FF',
  accent500: '#8A4FFF',
  accent600: '#6D3FCC',
  accent700: '#502F99',
  accent800: '#331F66',
  accent900: '#160F33',
  // Danger shades
  danger50: '#FFE6E6',
  danger100: '#FFB3B3',
  danger200: '#FF8080',
  danger300: '#FF4D4D',
  danger400: '#FF1A1A',
  danger500: '#FF4F4F',
  danger600: '#CC3F3F',
  danger700: '#992F2F',
  danger800: '#661F1F',
  danger900: '#330F0F',
  // Success shades
  success50: '#E6FFF0',
  success100: '#B3FFD1',
  success200: '#80FFB2',
  success300: '#4DFF93',
  success400: '#1AFF74',
  success500: '#4FF08B',
  success600: '#3FCC6F',
  success700: '#2F9953',
  success800: '#1F6637',
  success900: '#0F331B',
  // Warning shades
  warning50: '#FFFBEB',
  warning100: '#FEF3C7',
  warning200: '#FDE68A',
  warning300: '#FCD34D',
  warning400: '#FBBF24',
  warning500: '#F59E0B',
  warning600: '#D97706',
  warning700: '#B45309',
  warning800: '#92400E',
  warning900: '#78350F',
  // Info shades
  info50: '#EFF6FF',
  info100: '#DBEAFE',
  info200: '#BFDBFE',
  info300: '#93C5FD',
  info400: '#60A5FA',
  info500: '#3B82F6',
  info600: '#2563EB',
  info700: '#1D4ED8',
  info800: '#1E40AF',
  info900: '#1E3A8A',
  // Chart colors from Figma
  chartBlue: '#3B82F6',
  chartPurple: '#A855F7',
  chartOrange: '#F97316',
  chartGreen: '#22C55E',
  chartRed: '#EF4444',
  chartYellow: '#EAB308',
  // Traffic colors from Figma
  trafficStable: '#3B82F6',
  trafficCanary: '#A855F7',
  trafficSplit: '#6B7280',
};

export const spacing = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
};

// Semantic spacing tokens from Figma
export const semanticSpacing = {
  cardPadding: '24px',
  panelPadding: '16px',
  cellPadding: '12px 16px',
  badgePadding: '4px 12px',
  chipPadding: '6px 12px',
  logLinePadding: '4px 0px',
};

export const radius = {
  sm: '6px',
  md: '8px', // Fixed: Figma spec is 8px, not 10px
  lg: '12px', // Fixed: Figma spec is 12px, not 14px
  xl: '16px', // Fixed: Figma spec is 16px, not 18px
  full: '9999px',
  card: '8px', // Fixed: Figma card borderRadius is 8px (matches md)
};

export const shadows = {
  none: 'none',
  card: '0 8px 24px rgba(0, 0, 0, 0.25)', // Fixed: Figma modal shadow
  cardHover: '0 4px 12px rgba(0, 0, 0, 0.15)', // Fixed: Figma cardHover shadow
  focus: '0 0 0 2px rgba(88, 166, 255, 0.3)', // Fixed: Figma focus ring (blue, not cyan)
};

export const transitions = {
  fast: '150ms',
  normal: '200ms',
  slow: '300ms',
  slower: '500ms',
  slowest: '700ms',
};

export const motion = {
  // Easing functions
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  // Spring animations
  spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  // Duration presets
  duration: {
    instant: '0ms',
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    slower: '500ms',
    slowest: '700ms',
  },
  // Common animation values
  stagger: {
    fast: '50ms',
    normal: '100ms',
    slow: '150ms',
  },
};

export const fonts = {
  heading: ['Satoshi', 'Inter', 'sans-serif'],
  body: ['Inter', 'sans-serif'],
  mono: ['Geist Mono', 'ui-monospace', 'SFMono-Regular'],
};

export const typography = {
  // Headings
  h1: { fontSize: '32px', lineHeight: '1.25', fontWeight: '700', letterSpacing: '-0.5px' },
  h2: { fontSize: '24px', lineHeight: '1.33', fontWeight: '600', letterSpacing: '-0.25px' },
  h3: { fontSize: '20px', lineHeight: '1.4', fontWeight: '600' },
  h4: { fontSize: '18px', lineHeight: '1.33', fontWeight: '600' },
  h5: { fontSize: '16px', lineHeight: '1.5', fontWeight: '600' },
  h6: { fontSize: '14px', lineHeight: '1.43', fontWeight: '600' },
  // Body text
  bodyL: { fontSize: '16px', lineHeight: '1.5', fontWeight: '400' },
  bodyM: { fontSize: '14px', lineHeight: '1.43', fontWeight: '400' },
  bodyS: { fontSize: '12px', lineHeight: '1.33', fontWeight: '400' },
  // Mono (Logs/Code)
  monoL: { fontSize: '14px', lineHeight: '1.67', fontWeight: '400' },
  monoM: { fontSize: '12px', lineHeight: '1.67', fontWeight: '400' },
  monoS: { fontSize: '11px', lineHeight: '1.67', fontWeight: '400' },
  // Tailwind scale (xs → 6xl)
  xs: { fontSize: '0.75rem', lineHeight: '1rem', fontWeight: '400' }, // 12px
  sm: { fontSize: '0.875rem', lineHeight: '1.25rem', fontWeight: '400' }, // 14px
  base: { fontSize: '1rem', lineHeight: '1.5rem', fontWeight: '400' }, // 16px
  lg: { fontSize: '1.125rem', lineHeight: '1.75rem', fontWeight: '400' }, // 18px
  xl: { fontSize: '1.25rem', lineHeight: '1.75rem', fontWeight: '400' }, // 20px
  '2xl': { fontSize: '1.5rem', lineHeight: '2rem', fontWeight: '600' }, // 24px
  '3xl': { fontSize: '1.875rem', lineHeight: '2.25rem', fontWeight: '600' }, // 30px
  '4xl': { fontSize: '2.25rem', lineHeight: '2.5rem', fontWeight: '700' }, // 36px
  '5xl': { fontSize: '3rem', lineHeight: '1', fontWeight: '700' }, // 48px
  '6xl': { fontSize: '3.75rem', lineHeight: '1', fontWeight: '700' }, // 60px
};

export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  toast: 1080,
  max: 9999,
};

export const gradients = {
  primary: 'linear-gradient(135deg, #4FF0E6 0%, #8A4FFF 100%)',
  accent: 'linear-gradient(135deg, #8A4FFF 0%, #4FF0E6 100%)',
  hero: 'linear-gradient(135deg, #0D1117 0%, #161B22 50%, #0D1117 100%)',
  card: 'linear-gradient(145deg, #161B22 0%, #0D1117 100%)',
  glow: 'radial-gradient(ellipse at center, rgba(79, 240, 230, 0.4) 0%, transparent 70%)',
  surface: 'linear-gradient(180deg, #161B22 0%, #1C2128 100%)',
  // Brand gradients
  brandPrimary: 'linear-gradient(135deg, #4FF0E6 0%, #1AE0D7 100%)',
  brandAccent: 'linear-gradient(135deg, #8A4FFF 0%, #6D3FCC 100%)',
  brandCombined: 'linear-gradient(135deg, #4FF0E6 0%, #8A4FFF 100%)',
};

export const tokens = {
  colors,
  spacing,
  semanticSpacing,
  radius,
  shadows,
  transitions,
  motion,
  fonts,
  typography,
  zIndex,
  gradients,
};

export type ThemeTokens = typeof tokens;
