"use client";

import { cn } from "@/lib/utils";

interface UsageMeterExplainerProps {
  className?: string;
}

export function UsageMeterExplainer({ className }: UsageMeterExplainerProps) {
  return (
    <section className={cn("py-16 px-6", className)}>
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <span className="inline-block rounded-full bg-blue-500/10 px-4 py-1.5 text-sm font-medium text-blue-400 ring-1 ring-blue-500/20">
            Transparent Usage
          </span>
          <h2 className="mt-4 text-2xl font-bold text-white sm:text-3xl">
            Always know where you stand
          </h2>
          <p className="mt-4 text-zinc-400">
            Your usage dashboard shows exactly how many scans you have left, when
            your allowance resets, and your search history.
          </p>
        </div>

        {/* Usage Meter Demo */}
        <div className="mt-12 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">Daily scans used</p>
              <p className="mt-1 text-2xl font-bold text-white">
                42 <span className="text-lg text-zinc-500">/ 100</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-zinc-400">Resets in</p>
              <p className="mt-1 text-lg font-semibold text-zinc-300">6h 23m</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                style={{ width: "42%" }}
              />
            </div>
          </div>

          <p className="mt-4 text-center text-sm text-zinc-500">
            58 scans remaining today
          </p>
        </div>

        {/* What counts as a scan */}
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5">
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
            <h3 className="mt-4 font-semibold text-white">What is a scan?</h3>
            <p className="mt-2 text-sm text-zinc-400">
              One scan = one search query across all selected marketplaces. Results
              are cached, so repeat searches don't count.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5">
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
                  d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="mt-4 font-semibold text-white">When do limits reset?</h3>
            <p className="mt-2 text-sm text-zinc-400">
              Daily limits reset at midnight UTC. Your dashboard always shows the
              exact time remaining.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5">
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
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                />
              </svg>
            </div>
            <h3 className="mt-4 font-semibold text-white">What if I hit my limit?</h3>
            <p className="mt-2 text-sm text-zinc-400">
              New searches pause until reset. No extra charges. Your existing
              results stay accessible.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

