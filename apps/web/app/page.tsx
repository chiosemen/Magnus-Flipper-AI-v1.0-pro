'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import CarFlippingSection from '@/components/marketing/CarFlippingSection';
import MarketplaceMonitorSection from '@/components/marketing/MarketplaceMonitorSection';
import { LiveExecutionStrip } from '@/components/marketing/LiveExecutionStrip';
import LiveScanStatusBadge from '@/components/marketing/LiveScanStatusBadge';
import { UserScanPromise } from '@/components/marketing/UserScanPromise';
import WhyTimingMatters from '@/components/marketing/WhyTimingMatters';
import ScansThisWindow from '@/components/marketing/ScansThisWindow';
import { usePageView } from '@/hooks/usePageView';
import { startCheckout } from '@/lib/checkout';
import {
  EstimatedExecutionTime,
  NextScanETA,
  UserScanCount,
} from '@/components/marketing/ExecutionMetrics';
import ExecutionConfidenceBadge from '@/components/marketing/ExecutionConfidenceBadge';
import MarketplaceETA from '@/components/marketing/MarketplaceETA';

/* -----------------------------
   A/B HERO HEADLINES
----------------------------- */
const HERO_VARIANTS = [
  {
    id: 'A',
    headline: 'Get Real-Time Used Car Deals Before Anyone Else',
    sub: 'Real-time scan windows surface profitable used car deals while everyone else is still searching.',
  },
  {
    id: 'B',
    headline: 'Find Underpriced Cars Before Dealers See Them',
    sub: 'Magnus scans live car marketplaces during active windows. You get first look at mispriced vehicles — and decide what to flip.',
  },
];

/* -----------------------------
   MARKETPLACE LOGOS
----------------------------- */
const MARKETPLACES = [
  { name: 'Facebook Marketplace', src: '/logos/facebook.png' },
  { name: 'Vinted', src: '/logos/vinted.png' },
  { name: 'Gumtree', src: '/logos/gumtree.png' },
  { name: 'eBay', src: '/logos/ebay.png' },
];

/* -----------------------------
   STRIPE PRICING TIERS
----------------------------- */
const PRICING_TIERS = {
  short: {
    label: "Short Window Access",
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_SHORT || '',
    scans: 3,
    marketplaces: ['facebook'],
    durationMinutes: 5,
  },
  active: {
    label: "Active Window Access",
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ACTIVE || '',
    scans: 5,
    marketplaces: ['facebook'],
    durationMinutes: 720,
  },
  wide: {
    label: "Wide Window Access",
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_WIDE || '',
    scans: 5,
    marketplaces: ['facebook', 'gumtree', 'vinted', 'ebay', 'offerup'],
    durationMinutes: 720,
  },
};

/* -----------------------------
   DECAY HELPERS
----------------------------- */
const getDecayStyles = (ageMinutes: number) => {
  if (ageMinutes < 15) return 'opacity-100';
  if (ageMinutes < 60) return 'opacity-70 blur-[0.3px]';
  return 'opacity-40 grayscale blur-[0.6px]';
};

/* -----------------------------
   PAGE
----------------------------- */
export default function HomePage() {
  const [variant, setVariant] = useState(HERO_VARIANTS[0]);
  const [workerStatus, setWorkerStatus] = useState<'live' | 'idle'>('live');
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  // Track page view (privacy-safe, session-scoped)
  usePageView('landing');

  // Simple A/B rotation with localStorage persistence
  useEffect(() => {
    const stored = localStorage.getItem('hero_variant_id');
    if (stored) {
      const found = HERO_VARIANTS.find(v => v.id === stored);
      if (found) {
        setVariant(found);
        return;
      }
    }
    // No stored variant or invalid - pick random and store
    const pick = HERO_VARIANTS[Math.floor(Math.random() * HERO_VARIANTS.length)];
    localStorage.setItem('hero_variant_id', pick.id);
    setVariant(pick);
  }, []);

  // Stripe checkout handler
  const handleCheckout = async (priceId: string, tierName: string) => {
    if (process.env.NEXT_PUBLIC_MARKETING_ONLY === 'true') {
      return alert('Paid access opening shortly');
    }

    setCheckoutLoading(tierName);
    try {
      await startCheckout(priceId);
    } finally {
      setCheckoutLoading(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#070B12] text-white">

      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden px-6 pt-24 pb-20">
        <div className="mx-auto max-w-6xl text-center">

          {/* Worker Status Pill */}
          <div className="mb-6 flex justify-center">
            <div
              className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium ${
                workerStatus === 'live'
                  ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-400/30'
                  : 'bg-zinc-500/10 text-zinc-400 border border-white/10'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  workerStatus === 'live' ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'
                }`}
              />
              Scanners active · live ingest running
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight">
            {variant.headline}
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-white/70 text-base sm:text-lg">
            {variant.sub}
          </p>

          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/pricing"
              className="rounded-xl bg-cyan-300 px-8 py-3 text-black font-semibold hover:bg-cyan-200 transition"
            >
              Start scanning
            </Link>
            <Link
              href="/dashboard"
              className="rounded-xl border border-white/15 px-8 py-3 text-white/80 hover:bg-white/5 transition"
            >
              View live dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* ================= CAR FLIPPING SECTION ================= */}
      <CarFlippingSection />

      {/* ================= MARKETPLACE MONITOR ================= */}
      <MarketplaceMonitorSection />

      {/* ================= LOGO STRIP ================= */}
      <section className="border-t border-white/10 py-10 overflow-hidden">
        <div className="relative">
          <div className="flex gap-12 animate-[scroll_30s_linear_infinite] whitespace-nowrap px-6">
            {[...MARKETPLACES, ...MARKETPLACES].map((mkt, i) => (
              <div
                key={i}
                className="flex items-center gap-3 opacity-70 hover:opacity-100 transition"
              >
                <Image
                  src={mkt.src}
                  alt={mkt.name}
                  width={28}
                  height={28}
                />
                <span className="text-sm">{mkt.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= SCAN WINDOW EXPLAINER ================= */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

          <div>
            <h2 className="text-3xl font-bold mb-4">
              Timing beats volume
            </h2>
            <p className="text-white/70 mb-6">
              Each scan runs for a fixed window.
              When the window closes, the signal degrades.
            </p>

            <ul className="space-y-3 text-sm text-white/70">
              <li>• No scraping overload</li>
              <li>• No permanent monitoring</li>
              <li>• Scans run when you activate them</li>
            </ul>
          </div>

          {/* Visual mock */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="text-xs text-white/50 mb-3">Example scan</div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Facebook · iPhone 13</span>
                <span className="text-emerald-300">Live</span>
              </div>
              <div className="h-2 rounded bg-white/10 overflow-hidden">
                <div className="h-full w-2/3 bg-cyan-300/70 animate-pulse" />
              </div>
              <div className="text-xs text-white/50">
                Scan window · 12h remaining
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ================= SCAN STATUS ================= */}
      <section className="px-6 py-10 border-y border-white/10 bg-white/5">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

          <div className="text-sm text-white/70">
            Current scan status
          </div>

          <div className="flex items-center gap-4">
            <span className="px-3 py-1 rounded-full bg-emerald-400/10 text-emerald-300 text-xs">
              ● Active window
            </span>

            <span className="text-xs text-white/50">
              Next scan opens in <strong className="text-white">3h 12m</strong>
            </span>
          </div>

        </div>
      </section>

      {/* ================= WORKER STATUS ================= */}
      <section className="px-6 py-6 border-y border-white/10 bg-black">
        <div className="mx-auto max-w-6xl flex items-center justify-between text-sm">

          <div className="text-white/60">
            Scan engine
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 text-xs text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Workers scanning
            </span>

            <span className="text-white/40">
              4 active · Facebook
            </span>
          </div>

        </div>
      </section>

      {/* ================= LIVE LISTING SNAPSHOTS ================= */}
      <section className="px-6 py-24 border-t border-white/10">
        <div className="mx-auto max-w-6xl">

          <div className="mb-10">
            <h2 className="text-3xl font-bold mb-3">
              Live listing snapshots
            </h2>
            <p className="text-white/70 max-w-2xl">
              What our scanners surface during active windows.
              When the window closes, the signal fades.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'iPhone 13 · 128GB',
                price: '£320',
                marketplace: 'Facebook',
                location: 'London',
                img: '/listings/iphone.jpg',
                ageMinutes: 8,
                expired: false,
              },
              {
                title: 'PlayStation 5 · Disc',
                price: '£410',
                marketplace: 'Facebook',
                location: 'Manchester',
                img: '/listings/ps5.jpg',
                ageMinutes: 45,
                expired: false,
              },
              {
                title: 'Air Jordan 1 · Size 10',
                price: '£180',
                marketplace: 'Vinted',
                location: 'Berlin',
                img: '/listings/jordan.jpg',
                ageMinutes: 75,
                expired: true,
              },
            ].map((item, i) => (
              <div
                key={i}
                className={`relative rounded-2xl border border-white/10 overflow-hidden bg-white/5 transition-all duration-700 ${getDecayStyles(item.ageMinutes)} ${
                  !item.expired && 'hover:scale-[1.02] hover:border-cyan-300/40'
                }`}
                style={{
                  animation: item.expired ? 'decayPulse 4s ease-in-out infinite' : undefined,
                }}
              >
                {/* Image */}
                <div className="aspect-square bg-black/40">
                  <img
                    src={item.img}
                    alt={item.title}
                    className="h-full w-full object-cover"
                  />
                </div>

                {/* Overlay */}
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{item.price}</span>
                    <span className="text-xs text-white/50">
                      {item.marketplace}
                    </span>
                  </div>

                  <div className="text-sm text-white/80">
                    {item.title}
                  </div>

                  <div className="flex items-center justify-between text-xs text-white/50">
                    <span>{item.location}</span>
                    {item.expired ? (
                      <span className="text-red-400">Scan expired</span>
                    ) : (
                      <span className="text-emerald-300">Active window</span>
                    )}
                  </div>
                </div>

                {/* Expired overlay */}
                {item.expired && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="text-xs uppercase tracking-wide text-white/70">
                      Scan expired
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ================= SCAN WINDOW PRICING ================= */}
      <section className="px-6 py-28 border-t border-white/10">
        <div className="mx-auto max-w-6xl">

          {/* Execution Confidence Badge */}
          <ExecutionConfidenceBadge />

          {/* Live Scan Status Badge */}
          <LiveScanStatusBadge />

          {/* Scans Executed This Window */}
          <ScansThisWindow />

          {/* Execution Metrics */}
          <div className="space-y-1 mb-8">
            <EstimatedExecutionTime />
            <NextScanETA />
            <UserScanCount />
          </div>

          {/* Per-Marketplace ETA */}
          <MarketplaceETA />

          <UserScanPromise />

          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-3">
              Activate scan windows
            </h2>
            <p className="text-white/70 max-w-2xl">
              Choose how aggressively Magnus monitors the market for you.
            </p>
          </div>

          {/* Why Timing Matters Explainer */}
          <WhyTimingMatters />

          {/* --- ABOVE PRICING --- */}
          <section className="mx-auto max-w-3xl px-6 py-10">
            <LiveExecutionStrip />
            <p className="mt-3 text-xs text-white/50">
              Scans execute automatically during active windows. You always stay in control.
            </p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* OFFER 1 */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="text-sm text-white/50 mb-1">Targeted scans when timing matters</div>
              <h3 className="text-xl font-semibold mb-2">Short Window</h3>

              <div className="text-3xl font-bold mb-4">£30</div>

              <ul className="space-y-2 text-sm text-white/70">
                <li>• Limited scan coverage</li>
                <li>• Best for testing flips</li>
                <li>• Manual decision required</li>
              </ul>
              <div className="mt-4 text-xs text-white/50">
                Best for testing & casual flipping
              </div>

              <button
                onClick={() => handleCheckout(PRICING_TIERS.short.stripePriceId, 'short')}
                disabled={checkoutLoading === 'short'}
                className="mt-6 w-full rounded-lg bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-black hover:bg-cyan-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checkoutLoading === 'short' ? 'Loading...' : 'Activate Short Window'}
              </button>
            </div>

            {/* OFFER 2 */}
            <div className="rounded-2xl border border-cyan-300/30 bg-cyan-300/5 p-6">
              <div className="text-sm text-cyan-200 mb-1">Automated monitoring during peak hours</div>
              <h3 className="text-xl font-semibold mb-2">Active Window</h3>

              <div className="text-3xl font-bold mb-4">£100</div>

              <ul className="space-y-2 text-sm text-white/70">
                <li>• Balanced scan duration</li>
                <li>• Ideal for consistent flippers</li>
                <li>• Most common execution tier</li>
              </ul>
              <div className="mt-4 text-xs text-white/50">
                Best for consistent flippers
              </div>

              <button
                onClick={() => handleCheckout(PRICING_TIERS.active.stripePriceId, 'active')}
                disabled={checkoutLoading === 'active'}
                className="mt-6 w-full rounded-lg bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-black hover:bg-cyan-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checkoutLoading === 'active' ? 'Loading...' : 'Activate Active Window'}
              </button>
            </div>

            {/* OFFER 3 */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="text-sm text-white/50 mb-1">Maximum coverage, maximum opportunity</div>
              <h3 className="text-xl font-semibold mb-2">Wide Window</h3>

              <div className="text-3xl font-bold mb-4">£250–£300</div>

              <ul className="space-y-2 text-sm text-white/70">
                <li>• Maximum scan allocation</li>
                <li>• Best for high-volume flippers</li>
                <li>• Highest chance of first contact</li>
              </ul>
              <div className="mt-4 text-xs text-white/50">
                Best for high-frequency or professional flippers
              </div>

              <button
                onClick={() => handleCheckout(PRICING_TIERS.wide.stripePriceId, 'wide')}
                disabled={checkoutLoading === 'wide'}
                className="mt-6 w-full rounded-lg bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-black hover:bg-cyan-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checkoutLoading === 'wide' ? 'Loading...' : 'Activate Wide Window'}
              </button>
            </div>

          </div>

          {/* Inline Comparison */}
          <div className="mt-12 text-center text-sm text-white/60">
            Short = Precision · Active = Consistency · Wide = Coverage
          </div>

        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="border-t border-white/10 px-6 py-20 text-center">
        <h3 className="text-2xl font-bold mb-4">
          Open a scan window. See what the market misses.
        </h3>
        <Link
          href="/pricing"
          className="inline-block mt-4 rounded-xl bg-cyan-300 px-8 py-3 text-black font-semibold hover:bg-cyan-200 transition"
        >
          View pricing
        </Link>
      </section>

      {/* Tailwind animation */}
      <style jsx global>{`
        @keyframes scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes decayPulse {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 0.45; }
        }
      `}</style>
    </main>
  );
}
