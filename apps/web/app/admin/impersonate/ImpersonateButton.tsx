'use client';

import { useState } from 'react';

export function ImpersonateButton({ targetUserId }: { targetUserId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImpersonate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/impersonate/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_user_id: targetUserId }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json?.reason ?? 'Failed to impersonate');
        return;
      }

      window.location.href = '/dashboard';
    } catch (err) {
      setError('Failed to impersonate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleImpersonate}
        disabled={loading}
        className="rounded-md border border-cyan-400/40 px-3 py-1 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/20 disabled:opacity-50"
      >
        {loading ? 'Starting...' : 'Impersonate'}
      </button>
      {error && <span className="text-xs text-red-300">{error}</span>}
    </div>
  );
}
