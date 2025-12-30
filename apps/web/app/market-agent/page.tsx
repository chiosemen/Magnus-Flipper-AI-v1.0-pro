'use client';

import { useState } from 'react';
import { MarketBadge } from '@/components/badges/MarketBadge';
import { SummaryBanner, computeSummary } from '@/components/summary/SummaryBanner';
import { MarketAgentGate } from '@/components/market-agent/MarketAgentGate';

// TODO: Replace with actual entitlement check from /api/usage
const MOCK_ENTITLED = false; // Set to true to bypass gate during development

type Marketplace = 'facebook' | 'vinted' | 'gumtree';

type Listing = {
  source: Marketplace;
  title: string;
  priceText: string;
  url: string;
  image?: string;
  badge: 'verified' | 'live-capture' | 'recent' | 'in-progress';
  freshnessSeconds: number;
};

type SearchMeta = {
  marketplace: string;
  country: string;
  cached: boolean;
  cacheStatus: string;
  strategy?: string;
  ageSeconds?: number | null;
  ttlSeconds?: number;
  latencyMs?: number;
  note?: string;
};

export default function MarketAgentPage() {
  // TODO: Wire to real entitlement check
  const entitled = MOCK_ENTITLED;

  const [target, setTarget] = useState('');
  const [marketplace, setMarketplace] = useState<Marketplace>('gumtree');
  const [country, setCountry] = useState('GB');
  const [items, setItems] = useState<Listing[]>([]);
  const [meta, setMeta] = useState<SearchMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://magnus-api.vercel.app';

  if (!entitled) {
    return <MarketAgentGate />;
  }

  const handleDeploy = async () => {
    if (!target.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const url = new URL(`${API_BASE}/api/demo`);
      url.searchParams.set('q', target);
      url.searchParams.set('marketplace', marketplace);
      url.searchParams.set('country', country);
      url.searchParams.set('mode', 'agent');

      const response = await fetch(url.toString());
      const data = await response.json();

      if (data.items) {
        setItems(data.items);
        setMeta(data.meta || null);
      } else {
        setItems([]);
        setError(data.error || 'No results');
      }
    } catch (err: any) {
      setError(err.message || 'Deployment failed');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Magnus Market Agent</h1>
          <p className="text-slate-400">
            Autonomous observation of secondary markets with controlled execution.
          </p>
        </header>

        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 mb-6">
          <div className="flex flex-wrap gap-4 mb-4">
            <input
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleDeploy()}
              placeholder="Target (e.g., macbook pro, iphone 14)"
              className="flex-1 min-w-[200px] px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={marketplace}
              onChange={(e) => setMarketplace(e.target.value as Marketplace)}
              className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="gumtree">Gumtree</option>
              <option value="vinted">Vinted</option>
              <option value="facebook">Facebook</option>
            </select>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="Country"
              className="w-24 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleDeploy}
              disabled={loading || !target.trim()}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
            >
              {loading ? 'Deploying...' : 'Deploy Agent'}
            </button>
          </div>
        </div>

        {meta && (
          <div className="mb-6">
            <MetaBar meta={meta} />
          </div>
        )}

        {items.length > 0 && (
          <div className="mb-6">
            <SummaryBanner summary={computeSummary(items)} />
          </div>
        )}

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {items.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item, idx) => (
              <AgentListingCard key={idx} item={item} />
            ))}
          </div>
        ) : !loading && target ? (
          <div className="text-center py-12 text-slate-400">
            <p>No observations found. Try different parameters.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function MetaBar({ meta }: { meta: SearchMeta }) {
  const formatCacheStatus = (status: string) => {
    switch (status) {
      case 'hit':
        return 'Served from cache';
      case 'miss-filled':
        return 'Live observation';
      case 'lock-busy':
        return 'Warming';
      case 'browser-seed':
        return 'Browser observation';
      case 'error-soft':
        return 'Degraded mode';
      default:
        return status;
    }
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-sm">
      <div className="flex flex-wrap gap-4 items-center">
        <div>
          <strong>{formatCacheStatus(meta.cacheStatus || 'unknown')}</strong>
        </div>
        {meta.strategy && (
          <div className="text-slate-400">
            Strategy: <span className="text-white">{meta.strategy}</span>
          </div>
        )}
        {typeof meta.latencyMs === 'number' && (
          <div className="text-slate-400">
            Latency: <span className="text-white">{meta.latencyMs}ms</span>
          </div>
        )}
        {typeof meta.ageSeconds === 'number' && (
          <div className="text-slate-400">
            Age: <span className="text-white">{meta.ageSeconds}s</span>
          </div>
        )}
        {meta.note && <div className="text-slate-400 italic">{meta.note}</div>}
      </div>
    </div>
  );
}

function AgentListingCard({ item }: { item: Listing }) {
  const freshness =
    typeof item.freshnessSeconds === 'number' ? `${item.freshnessSeconds}s old` : '';

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noreferrer"
      className="block bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:border-blue-500 transition-colors"
    >
      {item.image && (
        <img
          src={item.image}
          alt={item.title}
          className="w-full h-48 object-cover rounded-lg mb-3"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      )}
      <div className="font-semibold mb-2 line-clamp-2">{item.title || '(untitled)'}</div>
      <div className="text-blue-400 mb-2">{item.priceText}</div>
      <div className="flex items-center gap-2 text-xs">
        <MarketBadge variant={item.badge} />
        {freshness && <span className="text-slate-400">· {freshness}</span>}
      </div>
    </a>
  );
}

