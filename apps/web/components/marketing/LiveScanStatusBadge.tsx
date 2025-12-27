'use client';

import { useEffect, useState } from 'react';

type ScanStatus = 'scanning' | 'closed' | 'no_credits' | 'unknown';

interface EntitlementResponse {
  status: ScanStatus;
  message?: string;
}

export default function LiveScanStatusBadge() {
  const [status, setStatus] = useState<ScanStatus>('unknown');

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/entitlements/check');
        if (!res.ok) {
          setStatus('unknown');
          return;
        }
        const data: EntitlementResponse = await res.json();
        setStatus(data.status || 'unknown');
      } catch (error) {
        // Gracefully degrade on API failure
        setStatus('unknown');
      }
    };

    // Check immediately
    checkStatus();

    // Poll every 30 seconds
    const interval = setInterval(checkStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  const getBadgeConfig = () => {
    switch (status) {
      case 'scanning':
        return {
          label: 'Scanning now',
          dotClass: 'bg-emerald-400 animate-pulse',
          containerClass: 'bg-emerald-500/10 text-emerald-300 border-emerald-400/30',
        };
      case 'closed':
        return {
          label: 'Signal warming up',
          dotClass: 'bg-zinc-500',
          containerClass: 'bg-zinc-500/10 text-zinc-400 border-white/10',
        };
      case 'no_credits':
        return {
          label: 'Out of Credits',
          dotClass: 'bg-amber-400',
          containerClass: 'bg-amber-500/10 text-amber-300 border-amber-400/30',
        };
      default:
        return {
          label: 'Signal warming up',
          dotClass: 'bg-zinc-500',
          containerClass: 'bg-zinc-500/10 text-zinc-400 border-white/10',
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <div className="flex justify-center mb-6">
      <div
        className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium border ${config.containerClass}`}
      >
        <span className={`h-2 w-2 rounded-full ${config.dotClass}`} />
        {config.label}
      </div>
    </div>
  );
}
