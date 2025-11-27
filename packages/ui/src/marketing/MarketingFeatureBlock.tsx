import * as React from 'react';

type Feature = {
  title: string;
  body: string;
  badge?: string;
};

type MarketingFeatureBlockProps = {
  title: string;
  description: string;
  features: Feature[];
};

export function MarketingFeatureBlock({ title, description, features }: MarketingFeatureBlockProps) {
  return (
    <section className="space-y-6 rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-lg backdrop-blur sm:p-10">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-cyan-200/80">{title}</p>
        <p className="text-lg text-slate-200 sm:text-xl">{description}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-inner transition hover:-translate-y-1 hover:border-cyan-300/60 hover:shadow-cyan-500/20"
          >
            {feature.badge ? (
              <span className="mb-2 inline-flex rounded-full bg-cyan-500/15 px-3 py-1 text-xs font-semibold text-cyan-100">
                {feature.badge}
              </span>
            ) : null}
            <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
            <p className="mt-2 text-sm text-slate-300">{feature.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
