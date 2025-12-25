"use client";

import Link from "next/link";
import { ArrowRight, Zap, Activity, Radio, Globe, Clock } from "lucide-react";

const TIERS = [
  {
    name: "Starter",
    slug: "starter",
    price: "$19",
    blurb: "For solo operators validating the arbitrage loop.",
    highlight: false,
    specs: [
      { icon: <Radio className="h-4 w-4" />, label: "Signal Volume", value: "~200/day" },
      { icon: <Clock className="h-4 w-4" />, label: "Scan Cadence", value: "Every 15min" },
      { icon: <Zap className="h-4 w-4" />, label: "Alert Latency", value: "<5min avg" },
      { icon: <Globe className="h-4 w-4" />, label: "Marketplaces", value: "3 platforms" },
      { icon: <Activity className="h-4 w-4" />, label: "Data Freshness", value: "Standard" },
    ],
    features: [
      "Pooled deal feed",
      "Saved search tracking",
      "Email alerts",
      "Basic quality filters",
      "Web dashboard access",
    ],
    cta: "Start Starter",
    href: "/register",
  },
  {
    name: "Operator",
    slug: "operator",
    price: "$49",
    blurb: "For serious traders who need speed and volume.",
    highlight: true,
    specs: [
      { icon: <Radio className="h-4 w-4" />, label: "Signal Volume", value: "~800/day" },
      { icon: <Clock className="h-4 w-4" />, label: "Scan Cadence", value: "Every 5min" },
      { icon: <Zap className="h-4 w-4" />, label: "Alert Latency", value: "<2min avg" },
      { icon: <Globe className="h-4 w-4" />, label: "Marketplaces", value: "8 platforms" },
      { icon: <Activity className="h-4 w-4" />, label: "Data Freshness", value: "Priority" },
    ],
    features: [
      "Everything in Starter",
      "Higher scan frequency",
      "Priority deal snapshots",
      "SMS + push notifications",
      "Advanced heat scoring",
      "Multi-region coverage",
    ],
    cta: "Enter Command Center",
    href: "/register",
  },
  {
    name: "Desk",
    slug: "desk",
    price: "$99",
    blurb: "For teams running volume operations.",
    highlight: false,
    specs: [
      { icon: <Radio className="h-4 w-4" />, label: "Signal Volume", value: "Unlimited" },
      { icon: <Clock className="h-4 w-4" />, label: "Scan Cadence", value: "Every 2min" },
      { icon: <Zap className="h-4 w-4" />, label: "Alert Latency", value: "<1min avg" },
      { icon: <Globe className="h-4 w-4" />, label: "Marketplaces", value: "All platforms" },
      { icon: <Activity className="h-4 w-4" />, label: "Data Freshness", value: "Real-time" },
    ],
    features: [
      "Everything in Operator",
      "Team workflows (5 seats)",
      "Custom automation rules",
      "API access (beta)",
      "Dedicated support channel",
      "Operator tools (as enabled)",
    ],
    cta: "Upgrade Intelligence",
    href: "/register",
  },
];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function ButtonLink({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition w-full",
        "focus:outline-none focus:ring-2 focus:ring-cyan-300/40",
        variant === "primary" &&
          "bg-cyan-300 text-slate-950 hover:bg-cyan-200 shadow-[0_0_0_1px_rgba(79,240,230,0.35),0_12px_40px_rgba(79,240,230,0.18)]",
        variant === "secondary" &&
          "border border-white/12 bg-white/5 text-white hover:bg-white/8 backdrop-blur"
      )}
    >
      {children}
    </Link>
  );
}

function Glow() {
  return (
    <>
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(79,240,230,0.18),transparent_62%)] blur-2xl" />
      <div className="pointer-events-none absolute -bottom-40 right-1/4 h-[520px] w-[820px] rounded-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.14),transparent_62%)] blur-2xl" />
    </>
  );
}

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#070B12] text-white">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/10">
        <Glow />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80 backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300/80 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-300" />
              </span>
              Live Intelligence Access
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight">
              Access the Intelligence Layer
            </h1>

            <p className="mt-5 text-base sm:text-lg text-white/70 max-w-2xl mx-auto">
              Real-time marketplace signals across Facebook, Vinted, eBay, Gumtree and more.
              Choose your scan speed. Scale when ready.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_0_1px_rgba(79,240,230,0.35),0_12px_40px_rgba(79,240,230,0.18)] hover:bg-cyan-200 transition"
              >
                Start Free Preview <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/8 backdrop-blur transition"
              >
                View Live Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Tiers */}
      <section className="relative py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200/80">
              PRICING TIERS
            </div>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-white">
              Choose your scan speed.
            </h2>
            <p className="mt-3 text-sm text-white/70 max-w-2xl mx-auto">
              Start fast. Upgrade when you want higher cadence and more signal volume.
              All tiers include core intelligence access.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {TIERS.map((tier) => (
              <div
                key={tier.slug}
                className={cn(
                  "relative rounded-2xl border p-6 backdrop-blur transition-all duration-200",
                  tier.highlight
                    ? "border-cyan-300/35 bg-[linear-gradient(180deg,rgba(79,240,230,0.10),rgba(255,255,255,0.04))] shadow-[0_0_40px_rgba(79,240,230,0.15)]"
                    : "border-white/10 bg-white/5 hover:border-white/20"
                )}
              >
                {tier.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <div className="rounded-full bg-cyan-300 px-4 py-1 text-xs font-bold text-slate-950 shadow-lg">
                      Most Used by Traders
                    </div>
                  </div>
                )}

                <div className="mb-6">
                  <div className="text-xl font-bold text-white">{tier.name}</div>
                  <div className="mt-2 flex items-end gap-2">
                    <div className="text-5xl font-black text-white">{tier.price}</div>
                    <div className="pb-2 text-sm text-white/60">/mo</div>
                  </div>
                  <p className="mt-2 text-sm text-white/70">{tier.blurb}</p>
                </div>

                {/* Specs Grid */}
                <div className="mb-6 space-y-2 rounded-xl border border-white/10 bg-black/25 p-4">
                  {tier.specs.map((spec, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-white/60">
                        <span className="text-cyan-200">{spec.icon}</span>
                        {spec.label}
                      </div>
                      <div className="font-semibold text-white">{spec.value}</div>
                    </div>
                  ))}
                </div>

                {/* Features */}
                <div className="mb-6 space-y-2">
                  {tier.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm text-white/75">
                      <span className="mt-0.5 text-cyan-200">▣</span>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <ButtonLink href={tier.href} variant={tier.highlight ? "primary" : "secondary"}>
                  {tier.cta} <ArrowRight className="h-4 w-4" />
                </ButtonLink>
              </div>
            ))}
          </div>

          {/* Command Center CTA */}
          <div className="mt-12 rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur">
            <div className="text-sm text-white/75 mb-3">
              Want to see the intelligence terminal before committing?
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/8 backdrop-blur transition"
              >
                Open Command Center <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/how-it-works"
                className="text-sm text-cyan-200 hover:text-cyan-100 transition"
              >
                Learn how it works →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ / Details */}
      <section className="border-t border-white/10 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200/80">
              INTELLIGENCE DETAILS
            </div>
            <h2 className="mt-3 text-2xl sm:text-3xl font-bold text-white">
              What you get with every tier.
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <div className="mb-2 text-base font-bold text-white">◎ Real-time Deal Snapshots</div>
              <p className="text-sm text-white/70">
                Visual confirmations for every high-value signal. See what you're buying before you contact.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <div className="mb-2 text-base font-bold text-white">◎ Multi-Marketplace Coverage</div>
              <p className="text-sm text-white/70">
                Facebook, Vinted, eBay, Gumtree, Craigslist, and more. One feed, multiple platforms.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <div className="mb-2 text-base font-bold text-white">◎ Spam + Risk Filtering</div>
              <p className="text-sm text-white/70">
                Automated filtering removes low-quality listings and time-wasters before you see them.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <div className="mb-2 text-base font-bold text-white">◎ Command Center Dashboard</div>
              <p className="text-sm text-white/70">
                Built to feel like a trading terminal. Dense, confident, designed for speed.
              </p>
            </div>
          </div>

          <div className="mt-10 text-center">
            <div className="text-sm text-white/60 mb-3">
              Need enterprise-level access or custom integrations?
            </div>
            <Link
              href="mailto:support@magnusflipper.com"
              className="text-sm font-semibold text-cyan-200 hover:text-cyan-100 transition"
            >
              Contact us for custom plans →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
