'use client';

import { useEffect } from 'react';

/**
 * Simple page view tracking hook
 * - No PII, no cookies, no cross-session tracking
 * - Uses sessionStorage for deduplication
 * - Silent failure on errors
 */
export function usePageView(page: string) {
  useEffect(() => {
    // Only track once per session per page
    const key = `pv_${page}`;
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem(key)) return;

    // Mark as tracked
    sessionStorage.setItem(key, '1');

    // Send beacon (non-blocking, best-effort)
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        '/api/telemetry/page-view',
        JSON.stringify({ page })
      );
    }
  }, [page]);
}
