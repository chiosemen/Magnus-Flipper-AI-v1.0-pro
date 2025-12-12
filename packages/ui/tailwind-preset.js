/**
 * Magnus Flipper AI - Tailwind Preset
 * 
 * Core Tailwind preset for all consuming apps in the monorepo.
 * Maps design tokens → Tailwind theme keys.
 * 
 * Supports theme switching (.theme-light, .theme-dark)
 */

import plugin from 'tailwindcss/plugin';

// Import tokens (we'll use the same structure as plugin.mjs for consistency)
const colors = {
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
  md: '8px', // Fixed: Figma spec is 8px
  lg: '12px', // Fixed: Figma spec is 12px
  xl: '16px', // Fixed: Figma spec is 16px
  full: '9999px',
  card: '8px', // Fixed: Figma card borderRadius is 8px
};

const shadows = {
  none: 'none',
  card: '0 8px 24px rgba(0, 0, 0, 0.25)', // Fixed: Figma modal shadow
  cardHover: '0 4px 12px rgba(0, 0, 0, 0.15)', // Fixed: Figma cardHover shadow
  focus: '0 0 0 2px rgba(88, 166, 255, 0.3)', // Fixed: Figma focus ring (blue)
};

const transitions = {
  fast: '150ms',
  normal: '200ms',
  slow: '300ms',
  slower: '500ms',
  slowest: '700ms',
};

const motion = {
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
};

const zIndex = {
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

const gradients = {
  primary: 'linear-gradient(135deg, #4FF0E6 0%, #8A4FFF 100%)',
  accent: 'linear-gradient(135deg, #8A4FFF 0%, #4FF0E6 100%)',
  hero: 'linear-gradient(135deg, #0D1117 0%, #161B22 50%, #0D1117 100%)',
  card: 'linear-gradient(145deg, #161B22 0%, #0D1117 100%)',
  glow: 'radial-gradient(ellipse at center, rgba(79, 240, 230, 0.4) 0%, transparent 70%)',
  surface: 'linear-gradient(180deg, #161B22 0%, #1C2128 100%)',
  brandPrimary: 'linear-gradient(135deg, #4FF0E6 0%, #1AE0D7 100%)',
  brandAccent: 'linear-gradient(135deg, #8A4FFF 0%, #6D3FCC 100%)',
  brandCombined: 'linear-gradient(135deg, #4FF0E6 0%, #8A4FFF 100%)',
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
  h5: { fontSize: '16px', lineHeight: '1.5', fontWeight: '600' },
  h6: { fontSize: '14px', lineHeight: '1.43', fontWeight: '600' },
  bodyL: { fontSize: '16px', lineHeight: '1.5', fontWeight: '400' },
  bodyM: { fontSize: '14px', lineHeight: '1.43', fontWeight: '400' },
  bodyS: { fontSize: '12px', lineHeight: '1.33', fontWeight: '400' },
  monoL: { fontSize: '14px', lineHeight: '1.67', fontWeight: '400' },
  monoM: { fontSize: '12px', lineHeight: '1.67', fontWeight: '400' },
  monoS: { fontSize: '11px', lineHeight: '1.67', fontWeight: '400' },
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
  '--warning': colors.warning,
  '--info': colors.info,
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

/**
 * Magnus Flipper AI Tailwind Preset
 * 
 * Provides:
 * - Design token mapping
 * - Color roles (primary, secondary, semantic)
 * - Radius roles
 * - Spacing scale
 * - Typography system
 * - Shadow layers
 * - Theme switching support (.theme-light, .theme-dark)
 */
const magnusPreset = {
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      // Color roles mapped from design tokens
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
        warning: { DEFAULT: 'var(--warning)' },
        info: { DEFAULT: 'var(--info)' },
        surface: 'var(--surface)',
        chart: {
          blue: colors.chartBlue,
          purple: colors.chartPurple,
          orange: colors.chartOrange,
          green: colors.chartGreen,
          red: colors.chartRed,
          yellow: colors.chartYellow,
        },
        traffic: {
          stable: colors.trafficStable,
          canary: colors.trafficCanary,
          split: colors.trafficSplit,
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          inverse: 'var(--text-inverse)',
        },
      },
      // Spacing scale from design tokens
      spacing,
      // Border radius roles
      borderRadius: {
        ...radius,
        DEFAULT: radius.md,
      },
      // Shadow layers
      boxShadow: {
        none: shadows.none,
        'card-hover': shadows.cardHover,
        modal: shadows.card,
        focus: shadows.focus,
      },
      // Transition durations
      transitionDuration: transitions,
      // Motion easing functions
      transitionTimingFunction: {
        'ease-in': motion.easeIn,
        'ease-out': motion.easeOut,
        'ease-in-out': motion.easeInOut,
        spring: motion.spring,
      },
      // Z-index layers
      zIndex,
      // Typography system
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
        h5: [typography.h5.fontSize, { lineHeight: typography.h5.lineHeight, fontWeight: typography.h5.fontWeight }],
        h6: [typography.h6.fontSize, { lineHeight: typography.h6.lineHeight, fontWeight: typography.h6.fontWeight }],
        'body-l': [typography.bodyL.fontSize, { lineHeight: typography.bodyL.lineHeight, fontWeight: typography.bodyL.fontWeight }],
        'body-m': [typography.bodyM.fontSize, { lineHeight: typography.bodyM.lineHeight, fontWeight: typography.bodyM.fontWeight }],
        'body-s': [typography.bodyS.fontSize, { lineHeight: typography.bodyS.lineHeight, fontWeight: typography.bodyS.fontWeight }],
        'mono-l': [typography.monoL.fontSize, { lineHeight: typography.monoL.lineHeight, fontWeight: typography.monoL.fontWeight }],
        'mono-m': [typography.monoM.fontSize, { lineHeight: typography.monoM.lineHeight, fontWeight: typography.monoM.fontWeight }],
        'mono-s': [typography.monoS.fontSize, { lineHeight: typography.monoS.lineHeight, fontWeight: typography.monoS.fontWeight }],
      },
      // Responsive breakpoints
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
    plugin(function ({ addBase, addUtilities }) {
      // Inject CSS variables for theme system
      addBase({
        ':root': baseVars,
        '[data-theme="light"]': { ...baseVars, ...lightVars },
        '[data-theme="dark"]': baseVars,
      });
      
      // Gradient utilities from design tokens
      addUtilities({
        '.bg-gradient-primary': {
          backgroundImage: gradients.primary,
        },
        '.bg-gradient-accent': {
          backgroundImage: gradients.accent,
        },
        '.bg-gradient-hero': {
          backgroundImage: gradients.hero,
        },
        '.bg-gradient-card': {
          backgroundImage: gradients.card,
        },
        '.bg-gradient-glow': {
          backgroundImage: gradients.glow,
        },
        '.bg-gradient-surface': {
          backgroundImage: gradients.surface,
        },
        '.bg-gradient-brand-primary': {
          backgroundImage: gradients.brandPrimary,
        },
        '.bg-gradient-brand-accent': {
          backgroundImage: gradients.brandAccent,
        },
        '.bg-gradient-brand-combined': {
          backgroundImage: gradients.brandCombined,
        },
      });
    }),
  ],
};

export default magnusPreset;
