'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

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
   PAGE
----------------------------- */
export default function HomePage() {
  const [variant, setVariant] = useState(HERO_VARIANTS[0]);
  const [workerStatus, setWorkerStatus] = useState<'live' | 'idle'>('live');

  // Simple A/B rotation (no infra, buyer-safe)
  useEffect(() => {
    const pick = HERO_VARIANTS[Math.floor(Math.random() * HERO_VARIANTS.length)];
    setVariant(pick);
  }, []);

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
              Magnus Flipper doesn't scrape endlessly.
              Each search runs inside a **defined scan window** — minutes or hours —
              when price inefficiencies actually exist.
            </p>

            <ul className="space-y-3 text-sm text-white/70">
              <li>• Instant scans for fast-moving listings</li>
              <li>• Time-boxed windows to control cost & noise</li>
              <li>• Signals disappear when the window closes</li>
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
                expired: false,
              },
              {
                title: 'PlayStation 5 · Disc',
                price: '£410',
                marketplace: 'Facebook',
                location: 'Manchester',
                img: '/listings/ps5.jpg',
                expired: false,
              },
              {
                title: 'Air Jordan 1 · Size 10',
                price: '£180',
                marketplace: 'Vinted',
                location: 'Berlin',
                img: '/listings/jordan.jpg',
                expired: true,
              },
            ].map((item, i) => (
              <div
                key={i}
                className={`relative rounded-2xl border border-white/10 overflow-hidden bg-white/5 transition ${
                  item.expired
                    ? 'opacity-50 grayscale blur-[1px]'
                    : 'hover:scale-[1.02] hover:border-cyan-300/40'
                }`}
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
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-sm font-medium">
                    Missed signal
                  </div>
                )}
              </div>
            ))}
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
      `}</style>
    </main>
  );
}
