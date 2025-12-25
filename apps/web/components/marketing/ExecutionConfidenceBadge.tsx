'use client';

import { useEffect, useState } from 'react';

type Confidence = 'high' | 'normal' | 'degraded';

interface ConfidenceData {
  confidence: Confidence;
  aliveWorkers: number;
  minutesSinceLastScan: number | null;
  reason: string;
}

export default function ExecutionConfidenceBadge() {
  const [data, setData] = useState<ConfidenceData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/metrics/execution-confidence');
        const json = await res.json();
        setData(json);
      } catch (error) {
        // Silent failure
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);

    return () => clearInterval(interval);
  }, []);

  if (!data) return null;

  const getBadgeConfig = () => {
    switch (data.confidence) {
      case 'high':
        return {
          label: 'Execution: High',
          color: 'text-emerald-400',
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-400/30',
          dot: 'bg-emerald-400',
        };
      case 'normal':
        return {
          label: 'Execution: Normal',
          color: 'text-cyan-400',
          bg: 'bg-cyan-500/10',
          border: 'border-cyan-400/30',
          dot: 'bg-cyan-400',
        };
      case 'degraded':
        return {
          label: 'Execution: Reconnecting',
          color: 'text-amber-400',
          bg: 'bg-amber-500/10',
          border: 'border-amber-400/30',
          dot: 'bg-amber-400',
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <div className="flex justify-center mb-4">
      <div
        className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium border ${config.bg} ${config.border} ${config.color}`}
        title={data.reason}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
        {config.label}
      </div>
    </div>
  );
}
