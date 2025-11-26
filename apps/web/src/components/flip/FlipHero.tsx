"use client";

import { Button } from "@/components/ui/button";

interface FlipHeroProps {
  title: string;
  subtitle: string;
  badge: string;
  ctaPrimary?: string;
  ctaSecondary?: string;
}

export function FlipHero({
  title,
  subtitle,
  badge,
  ctaPrimary = "Start free trial",
  ctaSecondary = "View pricing",
}: FlipHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8 sm:p-12">
      <div className="space-y-6">
        <span className="inline-flex items-center rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-200">
          {badge}
        </span>
        <h1 className="text-balance text-4xl font-bold leading-tight text-white sm:text-5xl">
          {title}
        </h1>
        <p className="max-w-3xl text-lg text-slate-300">{subtitle}</p>
        <div className="flex flex-wrap gap-3">
          <Button size="lg" className="rounded-full px-6 text-base font-semibold">
            {ctaPrimary}
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="rounded-full border-slate-700 bg-slate-900/60 text-slate-100"
            asChild
          >
            <a href="/pricing">{ctaSecondary}</a>
          </Button>
        </div>
      </div>
    </section>
  );
}
