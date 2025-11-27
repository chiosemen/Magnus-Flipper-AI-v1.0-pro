import * as React from 'react';

type Screenshot = {
  title: string;
  caption: string;
};

type MarketingScreenshotsProps = {
  title: string;
  description: string;
  items: Screenshot[];
};

export function MarketingScreenshots({ title, description, items }: MarketingScreenshotsProps) {
  return (
    <section className="space-y-6 rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-lg sm:p-10">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-white">{title}</h2>
        <p className="text-slate-300">{description}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((item, idx) => (
          <div
            key={`${item.title}-${idx}`}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 p-5 shadow-inner"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_40%)]" />
            <div className="relative space-y-3">
              <div className="h-32 rounded-xl bg-slate-800/70 ring-1 ring-white/10" />
              <div>
                <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                <p className="text-sm text-slate-300">{item.caption}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
