export const colors = {
  primary: '#4FF0E6',
  accent: '#8A4FFF',
  danger: '#FF4F4F',
  success: '#4FF08B',
  background: '#0D1117',
  surface: '#161B22',
  surfaceSubtle: '#1C2128',
  textPrimary: '#E6EDF3',
  textSecondary: '#9BA7B4',
  textMuted: '#6E7681',
  border: '#30363D',
  borderLight: '#21262D',
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

export const radius = {
  sm: '6px',
  md: '10px',
  lg: '14px',
  xl: '18px',
  full: '9999px',
  card: '14px',
};

export const shadows = {
  none: 'none',
  card: '0 10px 30px rgba(0, 0, 0, 0.35)',
  cardHover: '0 14px 40px rgba(0, 0, 0, 0.45)',
  focus: '0 0 0 3px rgba(79, 240, 230, 0.25)',
};

export const transitions = {
  fast: '150ms',
  normal: '200ms',
  slow: '300ms',
};

export const fonts = {
  heading: ['Satoshi', 'Inter', 'sans-serif'],
  body: ['Inter', 'sans-serif'],
  mono: ['Geist Mono', 'ui-monospace', 'SFMono-Regular'],
};

export const typography = {
  h1: { fontSize: '32px', lineHeight: '1.25', fontWeight: '700', letterSpacing: '-0.5px' },
  h2: { fontSize: '24px', lineHeight: '1.33', fontWeight: '600', letterSpacing: '-0.25px' },
  h3: { fontSize: '20px', lineHeight: '1.4', fontWeight: '600' },
  h4: { fontSize: '18px', lineHeight: '1.33', fontWeight: '600' },
  bodyL: { fontSize: '16px', lineHeight: '1.5', fontWeight: '400' },
  bodyM: { fontSize: '14px', lineHeight: '1.43', fontWeight: '400' },
  bodyS: { fontSize: '12px', lineHeight: '1.33', fontWeight: '400' },
  monoM: { fontSize: '12px', lineHeight: '1.67', fontWeight: '400' },
};

export const tokens = {
  colors,
  spacing,
  radius,
  shadows,
  transitions,
  fonts,
  typography,
};

export type ThemeTokens = typeof tokens;
