/**
 * Impersonation Banner
 *
 * Shows when an admin is impersonating another user.
 */

'use client';

import { useEffect, useState } from 'react';

type ImpersonationStatus = {
  impersonating: boolean;
  target_user_id?: string;
  expires_at?: string;
};

export function ImpersonationBanner() {
  const [status, setStatus] = useState<ImpersonationStatus | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch('/api/admin/impersonate/status');
        if (!res.ok) return;
        const json = (await res.json()) as ImpersonationStatus;
        if (active) setStatus(json);
      } catch (error) {
        console.warn('[impersonation] status fetch failed', error);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  if (!status?.impersonating) return null;

  const handleExit = async () => {
    setLoading(true);
    try {
      await fetch('/api/admin/impersonate/stop', { method: 'POST' });
      setStatus({ impersonating: false });
    } catch (error) {
      console.warn('[impersonation] stop failed', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-amber-500/20 border border-amber-500/40 text-amber-100 px-4 py-2 text-sm flex items-center justify-between">
      <div>
        <span className="font-semibold">Impersonation active</span>
        {status.target_user_id && (
          <span className="ml-2 text-amber-200/80">
            Target: {status.target_user_id}
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={handleExit}
        disabled={loading}
        className="rounded-md border border-amber-300/40 px-3 py-1 text-xs font-semibold text-amber-100 hover:bg-amber-500/30 disabled:opacity-50"
      >
        {loading ? 'Exiting...' : 'Exit impersonation'}
      </button>
    </div>
  );
}
