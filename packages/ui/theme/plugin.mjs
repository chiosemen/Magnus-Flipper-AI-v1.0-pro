import plugin from 'tailwindcss/plugin';

const colors = {
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

const spacing = {
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

const radius = {
  sm: '6px',
  md: '10px',
  lg: '14px',
  xl: '18px',
  full: '9999px',
  card: '14px',
};

const shadows = {
  none: 'none',
  card: '0 10px 30px rgba(0, 0, 0, 0.35)',
  cardHover: '0 14px 40px rgba(0, 0, 0, 0.45)',
  focus: '0 0 0 3px rgba(79, 240, 230, 0.25)',
};

const transitions = {
  fast: '150ms',
  normal: '200ms',
  slow: '300ms',
};

const fonts = {
  heading: ['Satoshi', 'Inter', 'sans-serif'],
  body: ['Inter', 'sans-serif'],
  mono: ['Geist Mono', 'ui-monospace', 'SFMono-Regular'],
};

const typography = {
  h1: { fontSize: '32px', lineHeight: '1.25', fontWeight: '700', letterSpacing: '-0.5px' },
  h2: { fontSize: '24px', lineHeight: '1.33', fontWeight: '600', letterSpacing: '-0.25px' },
  h3: { fontSize: '20px', lineHeight: '1.4', fontWeight: '600' },
  h4: { fontSize: '18px', lineHeight: '1.33', fontWeight: '600' },
  bodyL: { fontSize: '16px', lineHeight: '1.5', fontWeight: '400' },
  bodyM: { fontSize: '14px', lineHeight: '1.43', fontWeight: '400' },
  bodyS: { fontSize: '12px', lineHeight: '1.33', fontWeight: '400' },
  monoM: { fontSize: '12px', lineHeight: '1.67', fontWeight: '400' },
};

const baseVars = {
  '--background': colors.background,
  '--foreground': colors.textPrimary,
  '--card': colors.surface,
  '--card-foreground': colors.textPrimary,
  '--popover': colors.surfaceSubtle,
  '--popover-foreground': colors.textPrimary,
  '--primary': colors.primary,
  '--primary-foreground': '#0B0F13',
  '--secondary': colors.accent,
  '--secondary-foreground': colors.textPrimary,
  '--muted': colors.surfaceSubtle,
  '--muted-foreground': colors.textMuted,
  '--accent': colors.accent,
  '--accent-foreground': colors.textPrimary,
  '--destructive': colors.danger,
  '--destructive-foreground': '#0B0F13',
  '--border': colors.border,
  '--input': colors.border,
  '--ring': colors.primary,
  '--success': colors.success,
  '--text-primary': colors.textPrimary,
  '--text-secondary': colors.textSecondary,
  '--text-muted': colors.textMuted,
  '--text-inverse': '#0B0F13',
  '--surface': colors.surface,
  '--shadow-none': shadows.none,
  '--shadow-card-hover': shadows.cardHover,
  '--shadow-modal': shadows.card,
  '--shadow-focus': shadows.focus,
  '--radius': radius.md,
  '--radius-sm': radius.sm,
  '--radius-md': radius.md,
  '--radius-lg': radius.lg,
  '--radius-xl': radius.xl,
  '--radius-full': radius.full,
};

const lightVars = {
  '--background': '#FFFFFF',
  '--foreground': '#0D1117',
  '--card': '#FFFFFF',
  '--card-foreground': '#0D1117',
  '--popover': '#FFFFFF',
  '--popover-foreground': '#0D1117',
  '--muted': '#F6F8FA',
  '--muted-foreground': '#656D76',
  '--surface': '#F6F8FA',
};

const preset = {
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        success: { DEFAULT: 'var(--success)' },
        surface: 'var(--surface)',
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          inverse: 'var(--text-inverse)',
        },
      },
      spacing,
      borderRadius: { ...radius, DEFAULT: radius.md },
      boxShadow: {
        none: shadows.none,
        'card-hover': shadows.cardHover,
        modal: shadows.card,
        focus: shadows.focus,
      },
      transitionDuration: transitions,
      fontFamily: {
        heading: fonts.heading,
        body: fonts.body,
        mono: fonts.mono,
      },
      fontSize: {
        h1: [typography.h1.fontSize, { lineHeight: typography.h1.lineHeight, fontWeight: typography.h1.fontWeight, letterSpacing: typography.h1.letterSpacing }],
        h2: [typography.h2.fontSize, { lineHeight: typography.h2.lineHeight, fontWeight: typography.h2.fontWeight, letterSpacing: typography.h2.letterSpacing }],
        h3: [typography.h3.fontSize, { lineHeight: typography.h3.lineHeight, fontWeight: typography.h3.fontWeight }],
        h4: [typography.h4.fontSize, { lineHeight: typography.h4.lineHeight, fontWeight: typography.h4.fontWeight }],
        'body-l': [typography.bodyL.fontSize, { lineHeight: typography.bodyL.lineHeight, fontWeight: typography.bodyL.fontWeight }],
        'body-m': [typography.bodyM.fontSize, { lineHeight: typography.bodyM.lineHeight, fontWeight: typography.bodyM.fontWeight }],
        'body-s': [typography.bodyS.fontSize, { lineHeight: typography.bodyS.lineHeight, fontWeight: typography.bodyS.fontWeight }],
        'mono-m': [typography.monoM.fontSize, { lineHeight: typography.monoM.lineHeight, fontWeight: typography.monoM.fontWeight }],
      },
      screens: {
        xs: '375px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1440px',
      },
    },
  },
  plugins: [
    plugin(function ({ addBase }) {
      addBase({
        ':root': baseVars,
        '[data-theme="light"]': { ...baseVars, ...lightVars },
      });
    }),
  ],
};

export default preset;
