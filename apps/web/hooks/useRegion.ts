'use client';

export type Region = 'US' | 'UK';

export function useRegion(): { region: Region; currency: string; symbol: string } {
  if (typeof window === 'undefined') {
    return { region: 'US', currency: 'USD', symbol: '$' };
  }

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  const locale = navigator.language || '';

  const isUK =
    tz.includes('London') ||
    tz.includes('Dublin') ||
    locale.toLowerCase().includes('en-gb');

  return isUK
    ? { region: 'UK', currency: 'GBP', symbol: '£' }
    : { region: 'US', currency: 'USD', symbol: '$' };
}

