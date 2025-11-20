export type Brand = 'flipper' | 'findr';

export const themes = {
  flipper: {
    name: 'Magnus Flipper AI',
    primary: '#00C4FF',
    bg: '#0A0F14',
    panel: '#10161C',
    text: '#E6F6FF',
    subtext: '#8CA8B8'
  },
  findr: {
    name: 'Magnus Findr AI',
    primary: '#8F5EFF',
    bg: '#0A0014',
    panel: '#0E071A',
    text: '#F2E9FF',
    subtext: '#C7B6E6'
  }
} as const;

export function resolveTheme() {
  const brand = (process.env.APP_BRAND || 'flipper') as Brand;
  return themes[brand];
}
