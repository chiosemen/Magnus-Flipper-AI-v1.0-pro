"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  Bell,
  ChevronDown,
  CircleCheck,
  Command,
  Menu,
  Shield,
  Sparkles,
  Zap,
  X,
} from "lucide-react";

const MARKETPLACES = [
  "Facebook Marketplace",
  "Gumtree",
  "Vinted",
  "eBay",
  "Craigslist",
  "OfferUp",
  "Depop",
  "Mercari",
  "Nextdoor",
];

const FEATURES = [
  {
    icon: <Zap className="h-5 w-5" />,
    title: "Instant Alerts",
    desc: "Get notified the moment profitable listings appear — before anyone else reacts.",
  },
  {
    icon: <Command className="h-5 w-5" />,
    title: "Command Center Search",
    desc: "One search box, multiple marketplaces. Save searches and let the scanners work 24/7.",
  },
  {
    icon: <Sparkles className="h-5 w-5" />,
    title: "Signal Quality",
    desc: "Less noise. More actionable opportunities. Built to feel like a trader terminal, not a blog.",
  },
  {
    icon: <Activity className="h-5 w-5" />,
    title: "Live Feed",
    desc: "Visual deal confirmations and live snapshots — what's hot, what's new, what's fading.",
  },
  {
    icon: <Shield className="h-5 w-5" />,
    title: "Spam + Risk Filters",
    desc: "Reduce time-wasters with smarter filtering and better listing hygiene.",
  },
  {
    icon: <Bell className="h-5 w-5" />,
    title: "Always On",
    desc: "Monitors run continuously so you can stop refreshing and start reacting.",
  },
];

const TIERS = [
  {
    name: "Starter",
    price: "$19",
    blurb: "For solo flippers validating the loop.",
    bullets: ["Pooled deal feed", "Saved searches", "Email alerts", "Basic filtering"],
    cta: "Start Starter",
    href: "/register",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$49",
    blurb: "For serious sellers who need speed.",
    bullets: ["Faster scan cadence", "More marketplaces", "Deal feed + snapshots", "Priority alerts"],
    cta: "Go Pro",
    href: "/pricing",
    highlight: true,
  },
  {
    name: "Agency",
    price: "$99",
    blurb: "For teams running volume.",
    bullets: ["Higher limits", "Team workflows", "Advanced filters", "Operator tools (as enabled)"],
    cta: "Scale Up",
    href: "/pricing",
    highlight: false,
  },
];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function Glow() {
  return (
    <>
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(79,240,230,0.18),transparent_62%)] blur-2xl" />
      <div className="pointer-events-none absolute -bottom-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.18),transparent_62%)] blur-2xl" />
    </>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80 backdrop-blur">
      {children}
    </span>
  );
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
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition",
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

function SectionTitle({
  eyebrow,
  title,
  desc,
}: {
  eyebrow: string;
  title: string;
  desc?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200/80">
        {eyebrow}
      </div>
      <h2 className="mt-3 text-2xl sm:text-3xl font-bold text-white">{title}</h2>
      {desc ? <p className="mt-3 text-sm text-white/70">{desc}</p> : null}
    </div>
  );
}

function MarketplaceChips() {
  return (
    <div className="mt-6 flex flex-wrap justify-center gap-2">
      {MARKETPLACES.map((m) => (
        <span
          key={m}
          className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/75 backdrop-blur"
        >
          {m}
        </span>
      ))}
    </div>
  );
}

function TerminalCard() {
  const lines = useMemo(
    () => [
      { k: "Signal", v: "New listings spike detected" },
      { k: "Market", v: "Facebook • iPhone 15 • 128GB" },
      { k: "Spread", v: "Buy $420 → Sell $540" },
      { k: "Velocity", v: "↑ Heating up (last 12m)" },
      { k: "Action", v: "Open listing → Contact → Flip" },
    ],
    []
  );

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(79,240,230,0.12),transparent_35%),radial-gradient(circle_at_70%_60%,rgba(99,102,241,0.14),transparent_38%)]" />
      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-white/90">Magnus Terminal</div>
          <span className="inline-flex items-center gap-2 text-xs text-white/70">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300/80 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-300" />
            </span>
            Live
          </span>
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-black/35 p-4 font-mono text-xs text-white/80">
          {lines.map((l) => (
            <div key={l.k} className="flex items-center justify-between py-1">
              <span className="text-white/55">{l.k}</span>
              <span className="text-white/90">{l.v}</span>
            </div>
          ))}
          <div className="mt-3 h-px w-full bg-white/10" />
          <div className="mt-3 flex items-center justify-between">
            <span className="text-white/55">Scanner</span>
            <span className="text-cyan-200">Next sweep in 14s</span>
          </div>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <ButtonLink href="/register" variant="primary">
            Start Free Preview <ArrowRight className="h-4 w-4" />
          </ButtonLink>
          <ButtonLink href="/dashboard" variant="secondary">
            View Dashboard <ChevronDown className="h-4 w-4" />
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}

function Nav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#070B12]/70 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-300 text-slate-950 font-black">
              M
            </div>
            <div className="leading-tight">
              <div className="text-sm font-bold text-white">Magnus</div>
              <div className="text-xs text-white/60">Flipper AI</div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm text-white/80">
            <Link className="hover:text-white" href="/marketplaces">Marketplaces</Link>
            <Link className="hover:text-white" href="/pricing">Pricing</Link>
            <Link className="hover:text-white" href="/tech-trade">Tech Trade</Link>
            <Link className="hover:text-white" href="/how-it-works">How it works</Link>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link className="text-sm text-white/75 hover:text-white" href="/login">
              Sign in
            </Link>
            <ButtonLink href="/register" variant="primary">
              Start Free Preview <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </div>

          <button
            onClick={() => setOpen(true)}
            className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/12 bg-white/5 text-white"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      {open ? (
        <div className="fixed inset-0 z-[60]">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-[86%] max-w-sm border-l border-white/10 bg-[#070B12] p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-white">Menu</div>
              <button
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/12 bg-white/5 text-white"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 grid gap-2">
              {[
                ["/marketplaces", "Marketplaces"],
                ["/pricing", "Pricing"],
                ["/tech-trade", "Tech Trade"],
                ["/how-it-works", "How it works"],
                ["/login", "Sign in"],
              ].map(([href, label]) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/85"
                >
                  {label}
                </Link>
              ))}
            </div>

            <div className="mt-4">
              <ButtonLink href="/register" variant="primary">
                Start Free Preview <ArrowRight className="h-4 w-4" />
              </ButtonLink>
              <p className="mt-3 text-xs text-white/55">
                Tip: open <span className="text-white/75">/dashboard</span> to see the intelligence terminal UI.
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default function Page() {
  return (
    <main className="min-h-screen bg-[#070B12] text-white">
      <Nav />

      <section className="relative overflow-hidden">
        <Glow />
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Pill>
                  <span className="text-cyan-200">⚡</span> Instant Marketplace Alerts
                </Pill>
                <Pill>
                  <span className="text-cyan-200">🎯</span> Pooled + Personal Searches
                </Pill>
              </div>

              <h1 className="mt-5 text-4xl sm:text-5xl font-black tracking-tight">
                A premium intelligence terminal for{" "}
                <span className="text-cyan-200">marketplace flips</span>.
              </h1>

              <p className="mt-4 text-base sm:text-lg text-white/70 max-w-xl">
                Stop refreshing. Start reacting. Magnus Flipper AI tracks listings across Gumtree,
                Facebook Marketplace, Vinted & more — and surfaces actionable opportunities fast.
              </p>

              <div className="mt-7 flex flex-col sm:flex-row gap-3">
                <ButtonLink href="/register" variant="primary">
                  Start Free Preview <ArrowRight className="h-4 w-4" />
                </ButtonLink>
                <ButtonLink href="/pricing" variant="secondary">
                  See Pricing <ArrowRight className="h-4 w-4" />
                </ButtonLink>
              </div>

              <div className="mt-6 flex flex-wrap gap-3 text-xs text-white/70">
                <span className="inline-flex items-center gap-2">
                  <CircleCheck className="h-4 w-4 text-cyan-200" /> Real-time alerts
                </span>
                <span className="inline-flex items-center gap-2">
                  <CircleCheck className="h-4 w-4 text-cyan-200" /> 10+ marketplaces
                </span>
                <span className="inline-flex items-center gap-2">
                  <CircleCheck className="h-4 w-4 text-cyan-200" /> Built for speed
                </span>
              </div>

              <MarketplaceChips />
            </div>

            <TerminalCard />
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <SectionTitle
            eyebrow="WHY IT WINS"
            title="Dense utility. Cinematic polish."
            desc="You should feel like you're operating a trading screen — not scrolling a generic SaaS template."
          />

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur transition hover:border-cyan-300/30 hover:bg-white/[0.07]"
              >
                <div className="absolute inset-0 opacity-0 transition group-hover:opacity-100 bg-[radial-gradient(circle_at_30%_20%,rgba(79,240,230,0.14),transparent_45%)]" />
                <div className="relative">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/25 text-cyan-200">
                    {f.icon}
                  </div>
                  <div className="mt-4 text-base font-bold">{f.title}</div>
                  <p className="mt-2 text-sm text-white/70">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <SectionTitle
            eyebrow="PRICING"
            title="Choose your scan speed."
            desc="Start fast. Upgrade when you want higher cadence and more signal volume."
          />

          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {TIERS.map((t) => (
              <div
                key={t.name}
                className={cn(
                  "relative rounded-2xl border p-6 backdrop-blur",
                  t.highlight
                    ? "border-cyan-300/35 bg-[linear-gradient(180deg,rgba(79,240,230,0.10),rgba(255,255,255,0.04))]"
                    : "border-white/10 bg-white/5"
                )}
              >
                {t.highlight ? (
                  <div className="absolute right-4 top-4 rounded-full bg-cyan-300 px-3 py-1 text-xs font-bold text-slate-950">
                    Most Popular
                  </div>
                ) : null}

                <div className="text-lg font-bold">{t.name}</div>
                <div className="mt-2 flex items-end gap-2">
                  <div className="text-4xl font-black">{t.price}</div>
                  <div className="pb-1 text-sm text-white/60">/mo</div>
                </div>
                <p className="mt-2 text-sm text-white/70">{t.blurb}</p>

                <ul className="mt-5 space-y-2 text-sm text-white/75">
                  {t.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2">
                      <CircleCheck className="mt-0.5 h-4 w-4 text-cyan-200" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6">
                  <ButtonLink href={t.href} variant={t.highlight ? "primary" : "secondary"}>
                    {t.cta} <ArrowRight className="h-4 w-4" />
                  </ButtonLink>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
            <div className="text-sm text-white/75">
              Want the *real* premium feel? Open the Command Center.
            </div>
            <div className="mt-3 flex justify-center">
              <ButtonLink href="/dashboard" variant="secondary">
                Open Dashboard <ArrowRight className="h-4 w-4" />
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-[#05070C]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-white/70">
              <span className="font-semibold text-white">Magnus Flipper AI</span> — marketplace intelligence.
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-white/65">
              <Link className="hover:text-white" href="/pricing">Pricing</Link>
              <Link className="hover:text-white" href="/marketplaces">Marketplaces</Link>
              <Link className="hover:text-white" href="/tech-trade">Tech Trade</Link>
              <Link className="hover:text-white" href="/login">Sign in</Link>
            </div>
          </div>
          <div className="mt-6 text-xs text-white/45">
            © {new Date().getFullYear()} Magnus Systems. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}
