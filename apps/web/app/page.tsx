"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  LineChart,
  Radar,
  ShieldCheck,
  Zap,
  ArrowUpRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const marketplaces = [
  {
    name: "eBay",
    tagline: "Auctions, snipes & mispriced stock",
    refresh: "Every 30s",
    href: "/register?marketplace=ebay",
  },
  {
    name: "Amazon",
    tagline: "Retail arbitrage & FBA flips",
    refresh: "Every 60s",
    href: "/register?marketplace=amazon",
  },
  {
    name: "Facebook Marketplace",
    tagline: "Local steals before anyone else",
    refresh: "Every 45s",
    href: "/register?marketplace=facebook",
  },
  {
    name: "Gumtree",
    tagline: "Hidden UK classifieds value",
    refresh: "Every 90s",
    href: "/register?marketplace=gumtree",
  },
  {
    name: "Vinted",
    tagline: "Fashion & sneaker flips",
    refresh: "Every 60s",
    href: "/register?marketplace=vinted",
  },
  {
    name: "Craigslist",
    tagline: "Big-ticket local arbitrage",
    refresh: "Every 90s",
    href: "/register?marketplace=craigslist",
  },
  {
    name: "Depop",
    tagline: "Streetwear & vintage drops",
    refresh: "Every 60s",
    href: "/register?marketplace=depop",
  },
  {
    name: "StockX (beta)",
    tagline: "Hype cycles & sneaker heat",
    refresh: "Every 120s",
    href: "/register?marketplace=stockx",
  },
];

const stats = [
  { label: "Opportunities / day", value: "2,000+", accent: "text-emerald-400" },
  { label: "Tracked marketplaces", value: "12+", accent: "text-sky-400" },
  { label: "Average ROI window", value: "18–42%", accent: "text-violet-400" },
  { label: "Latency to alert", value: "< 3s", accent: "text-amber-300" },
];

const testimonials = [
  {
    name: "Lewis, Full-Time Flipper",
    quote:
      "Magnus Flipper turned my side-hustle into a real desk. I don't guess anymore — I just work the feed.",
    tag: "6-figure marketplace trader",
  },
  {
    name: "Amara, Sneaker & Tech",
    quote:
      "It feels like having a trader's terminal for eBay and Facebook. The profit curves changed everything.",
    tag: "Sneakers · Consoles · Audio gear",
  },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030013] text-slate-50">
      <BackgroundGlow />

      <div className="relative z-10 flex min-h-screen flex-col">
        <Navbar />

        <main className="flex-1">
          <HeroSection />
          <StatsStrip />
          <MarketplaceGrid />
          <LiveSignalsPanel />
          <PricingSection />
          <TestimonialsSection />
          <CTASection />
        </main>

        <Footer />
      </div>
    </div>
  );
}

/* --------------------------- UI SEGMENTS --------------------------- */

function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-gradient-to-b from-black/70 via-black/60 to-transparent backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6 md:py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-sky-400 shadow-[0_0_25px_rgba(129,140,248,0.8)]">
            <Sparkles className="h-4 w-4 text-black" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-wide text-slate-50">
              Magnus Flipper
            </span>
            <span className="text-[11px] text-slate-400">
              Real-Time Arbitrage Engine
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
          <NavLink href="#how-it-works" label="How it works" />
          <NavLink href="#marketplaces" label="Marketplaces" />
          <NavLink href="#pricing" label="Pricing" />
          <NavLink href="#testimonials" label="Results" />
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            asChild
            className="hidden text-xs text-slate-300 hover:text-slate-100 md:inline-flex"
          >
            <Link href="/login">Log in</Link>
          </Button>
          <Button
            asChild
            size="sm"
            className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-sky-400 text-xs font-semibold shadow-[0_0_25px_rgba(129,140,248,0.7)] hover:from-violet-400 hover:via-fuchsia-400 hover:to-sky-300"
          >
            <Link href="/register">
              Get early access
              <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="relative text-xs font-medium text-slate-300 transition hover:text-slate-50"
    >
      {label}
      <span className="absolute inset-x-0 -bottom-1 h-px bg-gradient-to-r from-transparent via-violet-400/70 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
    </a>
  );
}

function HeroSection() {
  return (
    <section className="relative mx-auto flex max-w-6xl flex-col gap-10 px-4 pb-16 pt-10 md:flex-row md:px-6 md:pb-24 md:pt-16">
      {/* Left column */}
      <div className="flex flex-1 flex-col gap-6">
        <Badge className="w-fit bg-slate-900/70 px-3 py-1 text-[11px] font-normal text-slate-300 ring-1 ring-violet-500/40">
          <span className="mr-1 inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Live arbitrage radar across eBay, Amazon, FB Marketplace &amp; more
        </Badge>

        <div className="space-y-4">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-balance text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl md:text-5xl"
          >
            The{" "}
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-sky-400 bg-clip-text text-transparent">
              Real-Time Arbitrage Engine
            </span>
            <span className="block text-slate-300">
              that treats every marketplace like a trading desk.
            </span>
          </motion.h1>

          <p className="max-w-xl text-sm leading-relaxed text-slate-300 md:text-[15px]">
            Magnus Flipper scans live listings across marketplaces, applies
            AI-driven comps, fee models and risk rules, and surfaces deals that
            match your profit targets — before the rest of the crowd ever sees
            them.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            asChild
            size="lg"
            className="bg-slate-50 px-5 text-xs font-semibold text-slate-900 hover:bg-white"
          >
            <Link href="/register">
              Start scanning in minutes
              <ArrowRight className="ml-2 h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-slate-600/70 bg-slate-900/40 px-5 text-xs text-slate-200 hover:bg-slate-900/70"
          >
            <Link href="/pricing">View pricing</Link>
          </Button>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Live feed · No guesswork · Cancel anytime
          </div>
        </div>

        <div
          id="how-it-works"
          className="mt-4 grid max-w-lg grid-cols-1 gap-4 text-xs text-slate-300 sm:grid-cols-2"
        >
          <FeatureBullet
            icon={<Radar className="h-3.5 w-3.5" />}
            title="Always-on radar"
            body="Continuously sweeps marketplaces for mispricings, bundles and distressed sellers."
          />
          <FeatureBullet
            icon={<LineChart className="h-3.5 w-3.5" />}
            title="True profit curves"
            body="Auto-includes fees, shipping, taxes and typical resale comps for each deal."
          />
          <FeatureBullet
            icon={<ShieldCheck className="h-3.5 w-3.5" />}
            title="Risk guardrails"
            body="Filters out fakes, category traps and listings that don't meet your floor."
          />
          <FeatureBullet
            icon={<Zap className="h-3.5 w-3.5" />}
            title="Instant alerts"
            body="Push, email or dashboard alerts when a steal hits your lane."
          />
        </div>
      </div>

      {/* Right column: hero card */}
      <div className="flex flex-1 items-center justify-center md:justify-end">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.55 }}
          className="relative w-full max-w-md"
        >
          <div className="pointer-events-none absolute -inset-10 rounded-[32px] bg-[radial-gradient(circle_at_top,_rgba(129,140,248,0.55),transparent_60%),radial-gradient(circle_at_bottom,_rgba(56,189,248,0.28),transparent_55%)] opacity-80 blur-3xl" />
          <Card className="relative overflow-hidden border border-violet-500/40 bg-slate-950/80 shadow-[0_0_60px_rgba(129,140,248,0.65)]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-slate-200">
                LIVE OPPORTUNITY FEED
              </CardTitle>
              <Badge className="bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-300">
                Streaming
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4 text-xs text-slate-200">
              <div className="rounded-lg bg-slate-900/70 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">eBay</span>
                  <span className="text-[11px] text-emerald-400">
                    +32% projected ROI
                  </span>
                </div>
                <div className="mt-1 text-sm font-medium text-slate-50">
                  Sony WH-1000XM5
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
                  <Metric label="Buy" value="£185" />
                  <Metric label="Target" value="£260" />
                  <Metric label="Spread" value="+£75" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <MiniOpportunity
                  marketplace="Facebook Marketplace"
                  item="PS5 Disc Edition"
                  roi="+28% ROI"
                />
                <MiniOpportunity
                  marketplace="Amazon"
                  item="DJI Mini 3 Pro"
                  roi="+23% ROI"
                />
              </div>

              <div className="mt-2 flex items-center justify-between border-t border-slate-800/70 pt-2 text-[10px] text-slate-400">
                <span>Magnus AI scores every deal using real comps &amp; fee models.</span>
                <span className="inline-flex items-center gap-1 text-emerald-300">
                  Live
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}

function FeatureBullet({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-1 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900/80 ring-1 ring-violet-500/40">
        {icon}
      </div>
      <div className="space-y-1">
        <div className="text-[12px] font-semibold text-slate-100">{title}</div>
        <p className="text-[11px] text-slate-400">{body}</p>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-900/90 px-2 py-1">
      <div className="text-[10px] text-slate-400">{label}</div>
      <div className="text-[11px] font-semibold text-slate-50">{value}</div>
    </div>
  );
}

function MiniOpportunity({
  marketplace,
  item,
  roi,
}: {
  marketplace: string;
  item: string;
  roi: string;
}) {
  return (
    <div className="rounded-lg bg-slate-900/70 p-2">
      <div className="text-[10px] text-slate-400">{marketplace}</div>
      <div className="mt-0.5 text-[11px] font-medium text-slate-50">{item}</div>
      <div className="mt-1 text-[10px] font-semibold text-emerald-400">{roi}</div>
    </div>
  );
}

function StatsStrip() {
  return (
    <section className="border-y border-white/5 bg-slate-950/60">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 text-xs text-slate-300 md:px-6 md:py-5">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col">
            <span className={`text-sm font-semibold ${s.accent}`}>{s.value}</span>
            <span className="text-[11px] text-slate-400">{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function MarketplaceGrid() {
  return (
    <section
      id="marketplaces"
      className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14"
    >
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-50 md:text-xl">
            Scanning Marketplaces
          </h2>
          <p className="mt-1 text-xs text-slate-400 md:text-[13px]">
            Each marketplace is tracked with its own fee model, risk profile and
            refresh cadence.
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="hidden border-slate-700 bg-slate-950/80 text-[11px] text-slate-200 hover:bg-slate-900 md:inline-flex"
        >
          <Link href="/pricing">
            See plans for multi-market desks
            <ArrowUpRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {marketplaces.map((mkt, idx) => (
          <motion.div
            key={mkt.name}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ delay: idx * 0.03, duration: 0.35 }}
          >
            <Link href={mkt.href} className="block h-full">
              <Card className="group relative flex h-full flex-col border border-slate-800/80 bg-gradient-to-br from-slate-950 via-slate-950/90 to-slate-950/60 shadow-[0_0_25px_rgba(15,23,42,0.9)] transition hover:-translate-y-1 hover:border-violet-400/80 hover:shadow-[0_0_40px_rgba(129,140,248,0.8)]">
                <CardContent className="flex flex-1 flex-col justify-between gap-3 p-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-50">
                        {mkt.name}
                      </span>
                      <span className="rounded-full bg-slate-900/80 px-2 py-0.5 text-[10px] text-slate-400">
                        {mkt.refresh}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">
                      {mkt.tagline}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Live listings · fee-adjusted profit · risk flags
                    </span>
                    <ArrowUpRight className="h-3 w-3 text-slate-500 transition group-hover:text-violet-300" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function LiveSignalsPanel() {
  return (
    <section className="border-y border-white/5 bg-slate-950/70">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-10 md:flex-row md:px-6">
        <div className="flex-1 space-y-3">
          <h3 className="text-sm font-semibold text-slate-50 md:text-base">
            Tuned like a trading desk
          </h3>
          <p className="text-xs text-slate-300 md:text-[13px]">
            Magnus Flipper is built like a quant terminal for marketplaces. Set
            your ROIs, risk rules and product lanes — we handle the scanning,
            scoring and surfacing.
          </p>
          <ul className="space-y-1.5 text-[11px] text-slate-400">
            <li>• Define watchlists by category, brand, price band or ROI.</li>
            <li>• Fee-aware profit curves for each marketplace and item type.</li>
            <li>
              • Opportunity tiers: "Steal", "Solid", "Watch" based on your floor.
            </li>
            <li>
              • Export to spreadsheets or pipe signals into your own stacks via
              API (coming soon).
            </li>
          </ul>
        </div>

        <div className="flex-1">
          <Card className="border border-violet-500/40 bg-slate-950/90">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-slate-200">
                Sample Arbitrage Desk
              </CardTitle>
              <Badge className="bg-sky-500/20 px-2 py-0.5 text-[10px] text-sky-300">
                Flipper · Desk · Agency
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3 text-[11px] text-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Daily signals</span>
                <span className="font-semibold text-emerald-400">2,180</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Average profit window</span>
                <span className="font-semibold text-violet-300">24%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Hit rate (targeted lanes)</span>
                <span className="font-semibold text-amber-300">71%</span>
              </div>
              <div className="mt-2 text-[10px] text-slate-500">
                Numbers shown are illustrative but tuned to real flipper desks
                Magnus is built for.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section
      id="pricing"
      className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16"
    >
      <div className="mb-6 flex flex-col gap-2 text-center">
        <h2 className="text-lg font-semibold text-slate-50 md:text-xl">
          Pricing tuned like a trading desk
        </h2>
        <p className="text-xs text-slate-400 md:text-[13px]">
          Start with solo flips, scale to a full arbitrage desk. Every tier
          includes the live engine and AI profit scoring.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <PricingCard
          name="Flipper"
          price="£39 / month"
          blurb="Solo arbitrage, serious signal."
          features={[
            "2 connected marketplaces",
            "Up to 200 opportunities / day",
            "AI profit scoring",
            "Email alerts",
          ]}
          cta="Start as Flipper"
          highlight={false}
        />
        <PricingCard
          name="Desk"
          price="£89 / month"
          blurb="Run Magnus like a real desk."
          features={[
            "Up to 5 marketplaces",
            "Priority opportunity queue",
            "Multi-user logins",
            "Slack / Discord alerts",
          ]}
          cta="Upgrade to Desk"
          highlight
        />
        <PricingCard
          name="Agency"
          price="Let's talk"
          blurb="For power users & agencies."
          features={[
            "Custom marketplace mix",
            "API & export integrations",
            "Hands-on onboarding",
            "Priority roadmap influence",
          ]}
          cta="Talk to us"
          highlight={false}
        />
      </div>
    </section>
  );
}

interface PricingCardProps {
  name: string;
  price: string;
  blurb: string;
  features: string[];
  cta: string;
  highlight?: boolean;
}

function PricingCard({
  name,
  price,
  blurb,
  features,
  cta,
  highlight,
}: PricingCardProps) {
  return (
    <Card
      className={`flex h-full flex-col border bg-slate-950/90 ${
        highlight
          ? "border-violet-400/80 shadow-[0_0_40px_rgba(129,140,248,0.8)]"
          : "border-slate-800/80"
      }`}
    >
      <CardContent className="flex flex-1 flex-col justify-between gap-4 p-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-50">{name}</h3>
            {highlight && (
              <Badge className="bg-violet-500/20 text-[10px] text-violet-200">
                Most popular
              </Badge>
            )}
          </div>
          <div className="text-sm font-semibold text-slate-100">{price}</div>
          <p className="text-[11px] text-slate-400">{blurb}</p>
        </div>
        <ul className="space-y-1.5 text-[11px] text-slate-300">
          {features.map((f) => (
            <li key={f}>• {f}</li>
          ))}
        </ul>
        <Button
          asChild
          size="sm"
          className={`mt-3 text-xs ${
            highlight
              ? "bg-slate-50 text-slate-900 hover:bg-white"
              : "bg-slate-900 text-slate-100 hover:bg-slate-800"
          }`}
        >
          <Link href="/register">{cta}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function TestimonialsSection() {
  return (
    <section
      id="testimonials"
      className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14"
    >
      <div className="mb-6 text-center">
        <h2 className="text-lg font-semibold text-slate-50 md:text-xl">
          Built with real flippers in mind
        </h2>
        <p className="mt-1 text-xs text-slate-400 md:text-[13px]">
          Magnus Flipper is for people who treat marketplace flipping like a
          trading desk, not a guessing game.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {testimonials.map((t) => (
          <Card
            key={t.name}
            className="border border-slate-800/80 bg-slate-950/90"
          >
            <CardContent className="space-y-3 p-5 text-[11px] text-slate-200">
              <p className="text-slate-100">"{t.quote}"</p>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-50">
                    {t.name}
                  </div>
                  <div className="text-[10px] text-slate-400">{t.tag}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-14 pt-4 md:px-6">
      <div className="relative overflow-hidden rounded-2xl border border-violet-500/40 bg-gradient-to-r from-slate-950 via-slate-950/95 to-slate-950 shadow-[0_0_45px_rgba(129,140,248,0.6)]">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[radial-gradient(circle,_rgba(56,189,248,0.4),transparent_60%)] blur-3xl" />
        <div className="relative flex flex-col items-start gap-4 px-5 py-6 md:flex-row md:items-center md:justify-between md:px-8 md:py-7">
          <div className="space-y-1.5">
            <h3 className="text-sm font-semibold text-slate-50 md:text-base">
              Ready to treat flipping like a trading desk?
            </h3>
            <p className="text-[11px] text-slate-300 md:text-[13px]">
              Connect your marketplaces, set your targets, and let Magnus
              Flipper work the feed while you decide which deals to take.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              asChild
              size="sm"
              className="bg-slate-50 px-4 text-xs font-semibold text-slate-900 hover:bg-white"
            >
              <Link href="/register">
                Get started now
                <ArrowRight className="ml-2 h-3 w-3" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-slate-400/40 bg-transparent text-xs text-slate-100 hover:bg-slate-900/60"
            >
              <Link href="/login">Already have access? Log in</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/5 bg-black/80">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-5 text-[11px] text-slate-500 md:flex-row md:px-6">
        <span>© {new Date().getFullYear()} Magnus Flipper. All rights reserved.</span>
        <div className="flex gap-3">
          <Link
            href="/pricing"
            className="hover:text-slate-300 hover:underline"
          >
            Pricing
          </Link>
          <Link href="/login" className="hover:text-slate-300 hover:underline">
            Login
          </Link>
          <Link
            href="/register"
            className="hover:text-slate-300 hover:underline"
          >
            Get access
          </Link>
        </div>
      </div>
    </footer>
  );
}

/* --------------------------- BACKGROUND --------------------------- */

function BackgroundGlow() {
  return (
    <div aria-hidden="true" className="pointer-events-none">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(129,140,248,0.28),transparent_55%),radial-gradient(circle_at_bottom,_rgba(56,189,248,0.25),transparent_55%)] opacity-70" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.85),#020617)] mix-blend-multiply" />
    </div>
  );
}
