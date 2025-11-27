import * as React from 'react';

type MarketingHeroProps = {
  eyebrow?: string;
  title: string;
  subtitle: string;
  highlights?: string[];
  actions?: React.ReactNode;
};

export function MarketingHero({
  eyebrow,
  title,
  subtitle,
  highlights = [],
  actions,
}: MarketingHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-indigo-500 to-cyan-400 px-6 py-12 shadow-2xl sm:px-10 sm:py-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.2),transparent_35%)]" />
      <div className="relative space-y-6">
        {eyebrow ? (
          <p className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-50">
            {eyebrow}
          </p>
        ) : null}
        <div className="space-y-3 text-slate-100">
          <h1 className="text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">{title}</h1>
          <p className="max-w-3xl text-base text-slate-100/80 sm:text-lg">{subtitle}</p>
        </div>
        {highlights.length ? (
          <div className="grid gap-3 sm:grid-cols-3">
            {highlights.map((item) => (
              <div
                key={item}
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-medium text-white backdrop-blur"
              >
                {item}
              </div>
            ))}
          </div>
        ) : null}
        {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
      </div>
    </section>
  );
}
