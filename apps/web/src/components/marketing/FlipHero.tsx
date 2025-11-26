"use client";

import { Button } from "@/components/ui/button";

interface FlipHeroProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryHref?: string;
  secondaryHref?: string;
}

export function FlipHero({
  eyebrow,
  title,
  subtitle,
  primaryHref = "/pricing",
  secondaryHref = "/searches/new",
}: FlipHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8 sm:p-12">
      <div className="space-y-6">
        <span className="inline-flex items-center rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-200">
          {eyebrow}
        </span>
        <h1 className="text-balance text-4xl font-bold leading-tight text-white sm:text-5xl">
          {title}
        </h1>
        <p className="max-w-3xl text-lg text-slate-300">{subtitle}</p>
        <div className="flex flex-wrap gap-3">
          <Button size="lg" className="rounded-full px-6 text-base font-semibold" asChild>
            <a href={primaryHref}>Start 7-day trial</a>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="rounded-full border-slate-700 bg-slate-900/60 text-slate-100"
            asChild
          >
            <a href={secondaryHref}>View live dashboard</a>
          </Button>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(14,165,233,0.12),transparent_25%),radial-gradient(circle_at_80%_0,rgba(99,102,241,0.12),transparent_30%),radial-gradient(circle_at_50%_80%,rgba(16,185,129,0.15),transparent_28%)]" />
    </section>
  );
}
