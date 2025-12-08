"use client";

import Link from "next/link";
import { motion } from "framer-motion";

// ---- Shared layout helpers ----

const Section = ({
  id,
  children,
  className = "",
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <section
    id={id}
    className={
      "w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 " +
      className
    }
  >
    {children}
  </section>
);

const PrimaryButton = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) => (
  <Link
    href={href}
    className="inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-semibold text-black bg-[linear-gradient(135deg,#f5f3ff,#e879f9,#22d3ee)] shadow-[0_0_30px_rgba(168,85,247,0.6)] hover:shadow-[0_0_40px_rgba(22,211,238,0.9)] transition-shadow"
  >
    {children}
  </Link>
);

const GhostButton = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) => (
  <Link
    href={href}
    className="inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-semibold border border-purple-500/60 bg-white/0 text-purple-100 hover:bg-purple-500/10 hover:border-purple-300 transition-colors"
  >
    {children}
  </Link>
);

// ---- Navbar ----

const Navbar = () => {
  return (
    <header className="sticky top-0 z-40 border-b border-purple-500/20 bg-black/70 backdrop-blur-xl">
      <nav className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 h-14">
        <Link href="/" className="flex items-center gap-2">
          <span className="h-7 w-7 rounded-full bg-gradient-to-br from-purple-500 via-fuchsia-400 to-sky-400 shadow-[0_0_25px_rgba(168,85,247,0.9)]" />
          <span className="text-sm sm:text-base font-semibold tracking-tight text-purple-50">
            Magnus Flipper
          </span>
        </Link>

        <div className="hidden sm:flex items-center gap-6 text-xs font-medium text-purple-100/80">
          <Link href="#marketplaces" className="hover:text-purple-50">
            Marketplaces
          </Link>
          <Link href="#pricing" className="hover:text-purple-50">
            Pricing
          </Link>
          <Link href="#how-it-works" className="hover:text-purple-50">
            How it Works
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden sm:inline text-xs font-medium text-purple-100/80 hover:text-purple-50"
          >
            Login
          </Link>
          <PrimaryButton href="/register">Get Started</PrimaryButton>
        </div>
      </nav>
    </header>
  );
};

// ---- Hero ----

const Hero = () => {
  return (
    <Section>
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-purple-500/40 bg-purple-950/40 px-3 py-1 text-[11px] font-medium text-purple-100/80 shadow-[0_0_25px_rgba(109,40,217,0.7)]"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live arbitrage radar across eBay, Amazon, FB Marketplace & more
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-slate-50"
          >
            <span className="block">
              The Real-Time{" "}
              <span className="bg-clip-text text-transparent bg-[linear-gradient(135deg,#e879f9,#a855f7,#22d3ee)]">
                Arbitrage Engine
              </span>
            </span>
            <span className="mt-3 block text-lg sm:text-xl font-normal text-slate-300/90">
              Find underpriced deals across every marketplace — analysed by
              Magnus AI with real profit projections.
            </span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="flex flex-wrap items-center gap-4"
          >
            <PrimaryButton href="/register">Start scanning in minutes</PrimaryButton>
            <GhostButton href="#pricing">View pricing</GhostButton>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-wrap gap-6 text-[11px] text-slate-300/80"
          >
            <div>
              <div className="font-semibold text-slate-100">Live feeds</div>
              <div>eBay · Amazon · FB Marketplace · Gumtree · Vinted</div>
            </div>
            <div>
              <div className="font-semibold text-slate-100">Investor-grade</div>
              <div>Profit curves, fees, risk flags & auto-watchlists</div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative"
        >
          <div className="relative rounded-3xl border border-purple-500/40 bg-gradient-to-b from-slate-950/80 to-slate-950/40 p-5 sm:p-6 shadow-[0_0_45px_rgba(109,40,217,0.7)] overflow-hidden">
            <div className="absolute -top-20 -right-16 h-56 w-56 rounded-full bg-[radial-gradient(circle_at_center,#a855f7,transparent)] opacity-60" />
            <div className="absolute bottom-[-80px] left-[-80px] h-64 w-64 rounded-full bg-[radial-gradient(circle_at_center,#22d3ee,transparent)] opacity-70" />

            <div className="relative space-y-4 text-xs text-slate-100/90">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-[11px] uppercase tracking-[0.18em] text-slate-400/80">
                  LIVE OPPORTUNITY FEED
                </div>
                <div className="flex items-center gap-2 text-[10px] text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Streaming
                </div>
              </div>

              <div className="grid gap-2 text-[11px]">
                {[
                  {
                    site: "eBay",
                    item: "Sony WH-1000XM5",
                    buy: "£185",
                    est: "£260",
                    roi: "+32%",
                  },
                  {
                    site: "Facebook Marketplace",
                    item: "PS5 Disc Edition",
                    buy: "£320",
                    est: "£420",
                    roi: "+28%",
                  },
                  {
                    site: "Amazon",
                    item: "DJI Mini 3 Pro",
                    buy: "£480",
                    est: "£620",
                    roi: "+23%",
                  },
                ].map((row) => (
                  <div
                    key={row.item}
                    className="flex items-center justify-between rounded-xl bg-slate-900/70 px-3 py-2 border border-slate-700/70"
                  >
                    <div>
                      <div className="font-medium text-slate-100">
                        {row.item}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {row.site}
                      </div>
                    </div>
                    <div className="text-right text-[10px]">
                      <div className="text-slate-300">
                        Buy: <span className="font-semibold">{row.buy}</span>
                      </div>
                      <div className="text-slate-300">
                        Target:{" "}
                        <span className="font-semibold">{row.est}</span>
                      </div>
                      <div className="font-semibold text-emerald-400">
                        {row.roi} ROI
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-xl border border-purple-500/50 bg-purple-900/30 px-3 py-2 text-[10px] text-purple-50 shadow-[0_0_25px_rgba(168,85,247,0.8)]">
                Magnus AI scores every deal using live comps, fee models and
                risk rules — so you see **real** profit, not guesswork.
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </Section>
  );
};

// ---- Marketplaces grid ----

const MarketplacesSection = () => {
  const marketplaces = [
    "eBay",
    "Amazon",
    "Facebook Marketplace",
    "Gumtree",
    "Vinted",
    "Craigslist",
    "Depop",
    "StockX (beta)",
  ];

  return (
    <Section id="marketplaces" className="pt-4">
      <div className="flex flex-col gap-8">
        <div className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-50">
            Scanning Marketplaces
          </h2>
          <p className="text-sm text-slate-300/85 max-w-lg">
            Real-time monitoring across major platforms. Each marketplace is
            tracked with its own fee model, risk profile and refresh cadence.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {marketplaces.map((name, idx) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: idx * 0.04 }}
              viewport={{ once: true }}
              className="group rounded-2xl border border-slate-700/70 bg-slate-950/70 px-4 py-4 shadow-[0_0_15px_rgba(15,23,42,0.8)] hover:border-purple-400/80 hover:shadow-[0_0_30px_rgba(168,85,247,0.7)] transition-all"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-50">
                    {name}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-400/85">
                    Live listings · fee-adjusted profit · risk flags
                  </div>
                </div>
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-purple-500 via-fuchsia-500 to-sky-400 opacity-80 group-hover:opacity-100 transition" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
};

// ---- Pricing ----

const PricingSection = () => {
  const tiers = [
    {
      name: "Flipper",
      price: "£39",
      tagline: "Solo arbitrage, serious signal.",
      features: [
        "2 connected marketplaces",
        "Up to 200 opportunities / day",
        "AI profit scoring",
        "Basic alerts via email",
      ],
      cta: "Start as Flipper",
      href: "/register?plan=flipper",
      highlighted: false,
    },
    {
      name: "Pro",
      price: "£89",
      tagline: "Daily deal flow across 5+ markets.",
      features: [
        "All major marketplaces",
        "Up to 1,000 opportunities / day",
        "Portfolio P&L tracking",
        "Discord / webhook alerts",
        "Multi-device sessions",
      ],
      cta: "Upgrade to Pro",
      href: "/register?plan=pro",
      highlighted: true,
    },
    {
      name: "Agency",
      price: "£199",
      tagline: "Agency & group arbitrage desks.",
      features: [
        "Unlimited opportunities",
        "Team workspaces",
        "Custom fee models per client",
        "White-label reports",
        "Priority support & SLAs",
      ],
      cta: "Talk to sales",
      href: "/pricing#agency",
      highlighted: false,
    },
  ];

  return (
    <Section id="pricing" className="pt-4">
      <div className="space-y-10">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-50">
            Pricing tuned like a trading desk
          </h2>
          <p className="text-sm text-slate-300/85">
            Start small, scale to a full arbitrage desk. Every tier includes
            our live arbitrage engine and AI profit scoring.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {tiers.map((tier, idx) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.06 }}
              viewport={{ once: true }}
              className={
                "relative rounded-3xl border bg-slate-950/80 px-5 py-6 flex flex-col justify-between shadow-[0_0_25px_rgba(15,23,42,0.9)] " +
                (tier.highlighted
                  ? "border-purple-400/80 shadow-[0_0_45px_rgba(168,85,247,0.9)] scale-[1.02]"
                  : "border-slate-700/70")
              }
            >
              {tier.highlighted && (
                <div className="absolute -top-3 right-4 rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500 px-3 py-1 text-[10px] font-semibold text-black shadow-[0_0_22px_rgba(168,85,247,0.9)]">
                  Most Popular
                </div>
              )}

              <div className="space-y-3">
                <div className="text-xs font-medium text-slate-400/90">
                  {tier.name}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-semibold text-slate-50">
                    {tier.price}
                  </span>
                  <span className="text-[11px] text-slate-400">/ month</span>
                </div>
                <p className="text-[11px] text-slate-300/85">
                  {tier.tagline}
                </p>

                <ul className="mt-3 space-y-2 text-[11px] text-slate-200/90">
                  {tier.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="mt-[3px] h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-5">
                <PrimaryButton href={tier.href}>{tier.cta}</PrimaryButton>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
};

// ---- Footer / CTA ----

const FinalCTA = () => (
  <Section className="pb-24">
    <div className="rounded-3xl border border-purple-500/50 bg-[radial-gradient(circle_at_top_left,#a855f7_0,transparent_55%),radial-gradient(circle_at_bottom_right,#22d3ee_0,transparent_60%),#020617] px-6 py-8 sm:px-8 sm:py-10 shadow-[0_0_50px_rgba(15,23,42,1)]">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <h3 className="text-lg sm:text-xl font-semibold text-slate-50">
            Switch from scrolling to scanning.
          </h3>
          <p className="text-sm text-slate-200/90">
            Plug Magnus Flipper into your marketplaces, set your risk bands and
            let the engine surface the trades worth taking.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <PrimaryButton href="/register">Get early access</PrimaryButton>
          <GhostButton href="/login">Already a member? Log in</GhostButton>
        </div>
      </div>
    </div>
  </Section>
);

// ---- Root page ----

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-black text-slate-50">
      {/* subtle starfield background effect */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,#1f2937_0,transparent_55%),radial-gradient(circle_at_bottom,#020617_0,transparent_60%)]" />

      <Navbar />
      <Hero />
      <MarketplacesSection />
      <PricingSection />
      <FinalCTA />
    </main>
  );
}
