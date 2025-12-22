/**
 * Feature Flags Hook for Web App
 */

'use client';

import { useEffect, useState } from 'react';

interface FlagsResponse {
  flags: Record<string, boolean>;
}

export function useFlags() {
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFlags() {
      try {
        const response = await fetch('/api/flags');
        if (response.ok) {
          const data: FlagsResponse = await response.json();
          setFlags(data.flags);
        }
      } catch (error) {
        console.error('Error fetching flags:', error);
        // Fallback to defaults
        setFlags({
          FEATURE_UI_CAR_FLIPPER: true,
          FEATURE_UI_MARKETPLACE_MONITOR_STYLE: true,
          FEATURE_DEV_PLACEHOLDERS_ALWAYS_ON: process.env.NODE_ENV === 'development',
        });
      } finally {
        setLoading(false);
      }
    }

    fetchFlags();
  }, []);

  return { flags, loading };
}

/**
 * Check if a specific flag is enabled
 */
export function useFlag(key: string): boolean {
  const { flags } = useFlags();
  return flags[key] ?? false;
}

