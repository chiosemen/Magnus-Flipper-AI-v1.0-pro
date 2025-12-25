import Image from "next/image";
import Link from "next/link";

const marketplaces = [
  { name: "Facebook Marketplace", src: "/marketplaces/facebook.svg" },
  { name: "Gumtree", src: "/marketplaces/gumtree.svg" },
  { name: "Vinted", src: "/marketplaces/vinted.svg" },
  { name: "eBay", src: "/marketplaces/ebay.svg" },
  { name: "Craigslist", src: "/marketplaces/craigslist.svg" },
  { name: "OfferUp", src: "/marketplaces/offerup.svg" },
];

const demoListings = [
  {
    title: "iPhone 15 • 128GB",
    market: "Facebook Marketplace",
    price: "£420",
    hint: "Underpriced vs avg",
    img: "/listings/listing-1.jpg",
  },
  {
    title: "MacBook Pro • M2",
    market: "Gumtree",
    price: "£650",
    hint: "Strong resale spread",
    img: "/listings/listing-2.jpg",
  },
  {
    title: "PS5 Bundle",
    market: "Vinted",
    price: "£280",
    hint: "Fast-moving category",
    img: "/listings/listing-3.jpg",
  },
  {
    title: "Nike Dunks",
    market: "eBay",
    price: "£95",
    hint: "Verified demand",
    img: "/listings/listing-4.jpg",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#070B12] text-white">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-52 left-1/2 h-[560px] w-[980px] -translate-x-1/2 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="absolute -bottom-48 left-1/3 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 py-10">
        {/* Header row (keep your existing nav if you already have layout/header) */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-200 text-[#070B12] font-black">
              M
            </div>
            <div className="leading-tight">
              <div className="font-semibold">Magnus</div>
              <div className="text-xs text-white/60">Flipper AI</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-white/70 hover:text-white transition">
              Sign in
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-xl bg-cyan-200 px-4 py-2 text-sm font-semibold text-[#070B12] hover:bg-cyan-100 transition"
            >
              Start Free Preview →
            </Link>
          </div>
        </div>

        {/* HERO */}
        <section className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
              Instant marketplace alerts • Pooled + personal searches
            </p>

            <h1 className="text-4xl md:text-6xl font-black tracking-tight">
              Find underpriced listings <span className="text-cyan-200">before</span> anyone else.
            </h1>

            <p className="mt-4 max-w-xl text-white/70">
              Magnus Flipper AI scans marketplaces and surfaces opportunities fast — so you stop refreshing
              and start reacting.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-xl bg-cyan-200 px-5 py-3 text-sm font-semibold text-[#070B12] hover:bg-cyan-100 transition"
              >
                Start Free Preview →
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10 transition"
              >
                See scan plans →
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-white/60">
              <div className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-cyan-300/90" />
                Real-time alerts
              </div>
              <div className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-cyan-300/90" />
                Facebook-first options
              </div>
              <div className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-cyan-300/90" />
                Multi-market upgrades
              </div>
            </div>
          </div>

          {/* Terminal TEASE (small, not dominant) */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Preview: live signal panel</div>
              <div className="inline-flex items-center gap-2 text-xs text-white/60">
                <span className="h-2 w-2 rounded-full bg-cyan-300" />
                Live
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-[#0A0F18] p-4 font-mono text-xs text-white/70">
              <div className="flex justify-between">
                <span className="text-white/40">Signal</span>
                <span>New listing spike detected</span>
              </div>
              <div className="mt-2 flex justify-between">
                <span className="text-white/40">Market</span>
                <span>Facebook • iPhone 15 • 128GB</span>
              </div>
              <div className="mt-2 flex justify-between">
                <span className="text-white/40">Spread</span>
                <span>Buy £420 → Sell £540</span>
              </div>
              <div className="mt-2 flex justify-between">
                <span className="text-white/40">Action</span>
                <span>Open → Contact → Flip</span>
              </div>
            </div>

            <div className="mt-4 flex gap-3">
              <Link
                href="/register"
                className="inline-flex flex-1 items-center justify-center rounded-xl bg-cyan-200 px-4 py-2 text-sm font-semibold text-[#070B12] hover:bg-cyan-100 transition"
              >
                Start Free Preview →
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex flex-1 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition"
              >
                See dashboard →
              </Link>
            </div>

            <p className="mt-3 text-xs text-white/50">
              The full terminal lives inside the dashboard — the landing page stays visual and simple.
            </p>
          </div>
        </section>

        {/* MARKETPLACE LOGOS (visual) */}
        <section className="mt-12">
          <div className="mb-4 text-sm text-white/60">Scans supported marketplaces</div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {marketplaces.map((m) => (
              <div
                key={m.name}
                className="flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
                title={m.name}
              >
                <div className="relative h-6 w-28 opacity-90">
                  <Image src={m.src} alt={m.name} fill className="object-contain" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* REAL LISTING VISUALS */}
        <section className="mt-12">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight">What you'll see</h2>
              <p className="mt-2 text-white/70 max-w-2xl">
                Real listing-style visuals. Quick context. Minimal fluff. Designed for fast decisions.
              </p>
            </div>
            <Link href="/pricing" className="text-sm text-cyan-200 hover:text-cyan-100 transition">
              View plans →
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {demoListings.map((d) => (
              <div
                key={d.title}
                className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur"
              >
                <div className="relative aspect-[4/3] bg-black/20">
                  <Image src={d.img} alt={d.title} fill className="object-cover" />
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold">{d.title}</div>
                    <div className="text-sm font-bold text-cyan-200">{d.price}</div>
                  </div>
                  <div className="mt-1 text-xs text-white/60">{d.market}</div>
                  <div className="mt-3 text-xs text-white/70">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2 py-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
                      {d.hint}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-3 text-xs text-white/50">
            Replace the demo images in <code className="text-white/70">/public/listings</code> with your real
            "listing-style" visuals (screenshots / anonymized / scraped examples).
          </p>
        </section>

        {/* HOW IT WORKS (light explanations) */}
        <section className="mt-12">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight">How it works</h2>
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              {
                title: "Pick marketplaces",
                body: "Start Facebook-only, then upgrade to multi-market when you're ready.",
              },
              {
                title: "Set searches",
                body: "Save the products you want. Use instant searches when you need speed.",
              },
              {
                title: "Get alerts fast",
                body: "When a match lands, you see it quickly — and act before the crowd.",
              },
            ].map((x) => (
              <div
                key={x.title}
                className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur p-5"
              >
                <div className="text-lg font-semibold">{x.title}</div>
                <div className="mt-2 text-sm text-white/70">{x.body}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="mt-12 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur p-8 text-center">
          <h3 className="text-2xl md:text-3xl font-black tracking-tight">
            Start with the free preview. Upgrade when you want faster scans.
          </h3>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-xl bg-cyan-200 px-6 py-3 text-sm font-semibold text-[#070B12] hover:bg-cyan-100 transition"
            >
              Start Free Preview →
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition"
            >
              See scan plans →
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
