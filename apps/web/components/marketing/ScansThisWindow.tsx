'use client';

import { useEffect, useState } from 'react';

interface ScansData {
  active: boolean;
  count?: number;
}

export default function ScansThisWindow() {
  const [data, setData] = useState<ScansData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/metrics/scans-this-window');
        const json = await res.json();
        setData(json);
      } catch (error) {
        // Silent failure
        setData(null);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);

    return () => clearInterval(interval);
  }, []);

  if (!data) return null;

  return (
    <div className="text-xs text-white/60 text-center mb-2">
      {data.active
        ? `Results updating: ${data.count}`
        : 'Signal warming up'}
    </div>
  );
}
