'use client';

import { useEffect, useState } from 'react';

function useMetric<T>(url: string) {
  const [data, setData] = useState<T | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(url);
        const json = await res.json();
        setData(json);
      } catch (error) {
        // Silent failure
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);

    return () => clearInterval(interval);
  }, [url]);

  return data;
}

export function EstimatedExecutionTime() {
  const data = useMetric<{ minutes: number }>('/api/metrics/estimated-execution');
  if (!data) return null;

  return (
    <div className="text-xs text-white/50 text-center">
      Estimated execution time: ~{data.minutes} min
    </div>
  );
}

export function NextScanETA() {
  const data = useMetric<{ etaMinutes: number | null }>('/api/metrics/next-scan-eta');
  if (!data || data.etaMinutes === null) return null;

  return (
    <div className="text-xs text-emerald-400/80 text-center">
      {data.etaMinutes <= 1
        ? 'Next scan executing now'
        : `Next scan ETA: ${data.etaMinutes} min`}
    </div>
  );
}

export function UserScanCount() {
  const data = useMetric<{ total: number | null }>('/api/metrics/user-scan-count');
  if (!data || data.total === null) return null;

  return (
    <div className="text-xs text-white/60 text-center">
      You've executed {data.total} scan{data.total === 1 ? '' : 's'}
    </div>
  );
}
