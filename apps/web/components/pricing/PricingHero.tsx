"use client";

import { VALUE_PROPOSITIONS } from "@/lib/pricing/constants";

export function PricingHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 py-24 px-6">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-amber-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl text-center">
        <span className="inline-block rounded-full bg-emerald-500/10 px-4 py-1.5 text-sm font-medium text-emerald-400 ring-1 ring-emerald-500/20">
          Pricing
        </span>

        <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
          Start scanning markets
          <br />
          <span className="bg-gradient-to-r from-emerald-400 to-amber-400 bg-clip-text text-transparent">
            in under 60 seconds
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400">
          One search. All marketplaces. Deduplicated, ranked, and verified results
          so you never miss a deal.
        </p>

        {/* Value Propositions Grid */}
        <div className="mt-16 grid gap-8 sm:grid-cols-3">
          {/* Unified Search */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 text-left backdrop-blur-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <svg
                className="h-5 w-5 text-emerald-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
            </div>
            <h3 className="mt-4 font-semibold text-white">
              {VALUE_PROPOSITIONS.unifiedSearch.title}
            </h3>
            <p className="mt-2 text-sm text-zinc-400">
              {VALUE_PROPOSITIONS.unifiedSearch.description}
            </p>
            <ul className="mt-4 space-y-2">
              {VALUE_PROPOSITIONS.unifiedSearch.points.map((point) => (
                <li key={point} className="flex items-center text-sm text-zinc-300">
                  <svg
                    className="mr-2 h-4 w-4 text-emerald-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 12.75l6 6 9-13.5"
                    />
                  </svg>
                  {point}
                </li>
              ))}
            </ul>
          </div>

          {/* Freshness Badges */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 text-left backdrop-blur-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <svg
                className="h-5 w-5 text-amber-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z"
                />
              </svg>
            </div>
            <h3 className="mt-4 font-semibold text-white">
              {VALUE_PROPOSITIONS.freshnessBadges.title}
            </h3>
            <p className="mt-2 text-sm text-zinc-400">
              {VALUE_PROPOSITIONS.freshnessBadges.description}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/20">
                Verified
              </span>
              <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-400 ring-1 ring-amber-500/20">
                Live Capture
              </span>
              <span className="inline-flex items-center rounded-full bg-zinc-500/10 px-2.5 py-0.5 text-xs font-medium text-zinc-400 ring-1 ring-zinc-500/20">
                Recent
              </span>
            </div>
          </div>

          {/* Usage Meter */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 text-left backdrop-blur-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <svg
                className="h-5 w-5 text-blue-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                />
              </svg>
            </div>
            <h3 className="mt-4 font-semibold text-white">
              {VALUE_PROPOSITIONS.usageMeter.title}
            </h3>
            <p className="mt-2 text-sm text-zinc-400">
              {VALUE_PROPOSITIONS.usageMeter.description}
            </p>
            <ul className="mt-4 space-y-2">
              {VALUE_PROPOSITIONS.usageMeter.points.map((point) => (
                <li key={point} className="flex items-center text-sm text-zinc-300">
                  <svg
                    className="mr-2 h-4 w-4 text-blue-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 12.75l6 6 9-13.5"
                    />
                  </svg>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

