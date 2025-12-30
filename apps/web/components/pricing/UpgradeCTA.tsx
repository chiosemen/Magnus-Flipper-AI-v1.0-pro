"use client";

import { cn } from "@/lib/utils";

interface UpgradeCTAProps {
  className?: string;
}

export function UpgradeCTA({ className }: UpgradeCTAProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900 to-emerald-950/30 p-8 sm:p-12",
        className
      )}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-amber-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-2xl text-center">
        <h2 className="text-2xl font-bold text-white sm:text-3xl">
          Ready to find more deals?
        </h2>
        <p className="mt-4 text-zinc-400">
          Join thousands of flippers who save hours every week with unified
          marketplace search. Start with a free trial, no credit card required.
        </p>

        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <a
            href="/search"
            className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-400"
          >
            Start scanning markets in under 60 seconds
            <svg
              className="ml-2 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
            </svg>
          </a>
          <a
            href="#compare"
            className="inline-flex items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800/50 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
          >
            Compare plans
          </a>
        </div>

        <p className="mt-6 text-xs text-zinc-500">
          No credit card required • Cancel anytime • Instant access
        </p>
      </div>
    </section>
  );
}

