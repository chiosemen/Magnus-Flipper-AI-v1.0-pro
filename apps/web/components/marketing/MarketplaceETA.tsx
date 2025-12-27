'use client';

import { useEffect, useState } from 'react';

interface MarketplaceETAItem {
  marketplace: string;
  status: string;
  etaMinutes: number;
}

export default function MarketplaceETA() {
  const [data, setData] = useState<{ items: MarketplaceETAItem[] } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/metrics/marketplace-eta');
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

  if (!data || data.items.length === 0) return null;

  const formatMarketplace = (name: string) => {
    const names: Record<string, string> = {
      facebook: 'Facebook',
      vinted: 'Vinted',
      gumtree: 'Gumtree',
      ebay: 'eBay',
      offerup: 'OfferUp',
    };
    return names[name.toLowerCase()] || name;
  };

  const formatETA = (minutes: number) => {
    if (minutes <= 1) return 'Scanning now';
    return '≈ 60 seconds';
  };

  return (
    <div className="mb-6">
      <div className="text-xs text-white/50 text-center mb-2">Live feed active</div>
      <div className="flex flex-wrap justify-center gap-2">
        {data.items.map((item) => (
          <div
            key={item.marketplace}
            className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs"
          >
            <span className="text-white/70">{formatMarketplace(item.marketplace)}</span>
            <span className="mx-1.5 text-white/30">·</span>
            <span
              className={
                item.etaMinutes <= 1 ? 'text-emerald-400/80' : 'text-white/60'
              }
            >
              {formatETA(item.etaMinutes)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
