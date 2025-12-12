import plugin from 'tailwindcss/plugin';
import type { Config } from 'tailwindcss';
import { colors, spacing, semanticSpacing, radius, shadows, transitions, motion, fonts, typography, zIndex, gradients } from './tokens';

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
  '--card-padding': semanticSpacing.cardPadding,
  '--panel-padding': semanticSpacing.panelPadding,
  '--badge-padding-x': '4px',
  '--badge-padding-y': '12px',
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

const preset: Config = {
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
      spacing,
      borderRadius: {
        ...radius,
        DEFAULT: radius.md,
      },
      boxShadow: {
        none: shadows.none,
        'card-hover': shadows.cardHover,
        modal: shadows.card,
        focus: shadows.focus,
      },
      transitionDuration: transitions,
      transitionTimingFunction: {
        'ease-in': motion.easeIn,
        'ease-out': motion.easeOut,
        'ease-in-out': motion.easeInOut,
        spring: motion.spring,
      },
      zIndex,
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
        xs: [typography.xs.fontSize, { lineHeight: typography.xs.lineHeight, fontWeight: typography.xs.fontWeight }],
        sm: [typography.sm.fontSize, { lineHeight: typography.sm.lineHeight, fontWeight: typography.sm.fontWeight }],
        base: [typography.base.fontSize, { lineHeight: typography.base.lineHeight, fontWeight: typography.base.fontWeight }],
        lg: [typography.lg.fontSize, { lineHeight: typography.lg.lineHeight, fontWeight: typography.lg.fontWeight }],
        xl: [typography.xl.fontSize, { lineHeight: typography.xl.lineHeight, fontWeight: typography.xl.fontWeight }],
        '2xl': [typography['2xl'].fontSize, { lineHeight: typography['2xl'].lineHeight, fontWeight: typography['2xl'].fontWeight }],
        '3xl': [typography['3xl'].fontSize, { lineHeight: typography['3xl'].lineHeight, fontWeight: typography['3xl'].fontWeight }],
        '4xl': [typography['4xl'].fontSize, { lineHeight: typography['4xl'].lineHeight, fontWeight: typography['4xl'].fontWeight }],
        '5xl': [typography['5xl'].fontSize, { lineHeight: typography['5xl'].lineHeight, fontWeight: typography['5xl'].fontWeight }],
        '6xl': [typography['6xl'].fontSize, { lineHeight: typography['6xl'].lineHeight, fontWeight: typography['6xl'].fontWeight }],
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
    plugin(function ({ addBase, addUtilities }) {
      addBase({
        ':root': baseVars,
        '[data-theme="light"]': { ...baseVars, ...lightVars },
      });
      
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

export default preset;
