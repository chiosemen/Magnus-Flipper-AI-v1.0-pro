import * as React from 'react';

type MarketingPricingCTAProps = {
  title: string;
  description: string;
  primaryAction?: React.ReactNode;
  secondaryAction?: React.ReactNode;
};

export function MarketingPricingCTA({
  title,
  description,
  primaryAction,
  secondaryAction,
}: MarketingPricingCTAProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 p-6 text-white shadow-2xl sm:p-10">
      <div className="space-y-4 sm:flex sm:items-center sm:justify-between sm:space-y-0">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold sm:text-3xl">{title}</h2>
          <p className="text-sm text-white/80 sm:text-base">{description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {primaryAction}
          {secondaryAction}
        </div>
      </div>
    </section>
  );
}
