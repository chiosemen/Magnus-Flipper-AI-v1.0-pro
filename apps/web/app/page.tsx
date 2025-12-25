'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSystemStatus } from '@/hooks/useSystemStatus';

/* -----------------------------
   A/B HERO HEADLINES
----------------------------- */
const HERO_VARIANTS = [
  {
    id: 'A',
    headline: 'Find underpriced listings before the market catches them',
    sub: 'Timed marketplace scans across Facebook and beyond. No noise. No guessing.',
  },
  {
    id: 'B',
    headline: 'Turn live marketplace listings into actionable trade signals',
    sub: 'We scan. We surface. You decide — within the window that matters.',
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
  const { status } = useSystemStatus(5000); // Poll every 5s

  // Simple A/B rotation (no infra, buyer-safe)
  useEffect(() => {
    const pick = HERO_VARIANTS[Math.floor(Math.random() * HERO_VARIANTS.length)];
    setVariant(pick);
  }, []);

  // Derive worker status
  const totalWorkers = status ? status.workers.active + status.workers.idle + status.workers.error : 0;
  const hasActiveWorkers = status ? status.workers.active > 0 || status.workers.idle > 0 : false;
  const workerStatus: 'live' | 'idle' = hasActiveWorkers ? 'live' : 'idle';

  // Derive scan window info
  const scanWindow = status?.scan_window;
  const isWindowActive = scanWindow?.status === 'active';
  const nextWindowSeconds = status?.next_window_in_seconds;
  const closesInSeconds = status?.closes_in_seconds;

  // Format countdown
  const formatCountdown = (seconds: number | null) => {
    if (seconds === null) return null;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
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
            {isWindowActive ? (
              <span className="px-3 py-1 rounded-full bg-emerald-400/10 text-emerald-300 text-xs">
                ● Active window
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-zinc-500/10 text-zinc-400 text-xs">
                ● No active window
              </span>
            )}

            {isWindowActive && closesInSeconds !== null && (
              <span className="text-xs text-white/50">
                Closes in <strong className="text-white">{formatCountdown(closesInSeconds)}</strong>
              </span>
            )}

            {!isWindowActive && nextWindowSeconds !== null && (
              <span className="text-xs text-white/50">
                Next scan opens in <strong className="text-white">{formatCountdown(nextWindowSeconds)}</strong>
              </span>
            )}
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
            {status && status.workers.active > 0 ? (
              <>
                <span className="flex items-center gap-2 text-xs text-emerald-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Workers scanning
                </span>

                <span className="text-white/40">
                  {status.workers.active} active
                  {scanWindow?.marketplace && ` · ${scanWindow.marketplace}`}
                </span>
              </>
            ) : (
              <>
                <span className="flex items-center gap-2 text-xs text-zinc-400">
                  <span className="h-2 w-2 rounded-full bg-zinc-500" />
                  Workers idle
                </span>

                <span className="text-white/40">
                  {status ? `${totalWorkers} total` : 'Loading...'}
                </span>
              </>
            )}
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

          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-3">
              Activate scan windows
            </h2>
            <p className="text-white/70 max-w-2xl">
              Pricing reflects scan intensity, duration, and marketplace coverage.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* OFFER 1 */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="text-sm text-white/50 mb-1">Facebook only</div>
              <h3 className="text-xl font-semibold mb-2">Short scan</h3>

              <div className="text-3xl font-bold mb-4">£30</div>

              <ul className="space-y-2 text-sm text-white/70">
                <li>• 3 searches</li>
                <li>• 5 minute window</li>
                <li>• Real-time listings</li>
              </ul>
            </div>

            {/* OFFER 2 */}
            <div className="rounded-2xl border border-cyan-300/30 bg-cyan-300/5 p-6">
              <div className="text-sm text-cyan-200 mb-1">Facebook only</div>
              <h3 className="text-xl font-semibold mb-2">Active window</h3>

              <div className="text-3xl font-bold mb-4">£100</div>

              <ul className="space-y-2 text-sm text-white/70">
                <li>• 5 instant searches</li>
                <li>• 12 hour window</li>
                <li>• Faster refresh cadence</li>
              </ul>
            </div>

            {/* OFFER 3 */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="text-sm text-white/50 mb-1">All marketplaces</div>
              <h3 className="text-xl font-semibold mb-2">Wide scan</h3>

              <div className="text-3xl font-bold mb-4">£250–£300</div>

              <ul className="space-y-2 text-sm text-white/70">
                <li>• 5 instant searches</li>
                <li>• 12 hour window</li>
                <li>• Facebook, Vinted, Gumtree, more</li>
              </ul>
            </div>

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
