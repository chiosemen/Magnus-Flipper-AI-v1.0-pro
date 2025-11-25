"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

export function Hero() {
  return (
    <section className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center">
      <div className="space-y-6">
        <Badge className="bg-cyan-500/10 text-cyan-300">New • Magnus Flipper / Findr</Badge>

        <div className="space-y-4">
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Real-time marketplace alerts.
            <span className="block text-cyan-300">Zero missed flips.</span>
          </h1>
          <p className="max-w-xl text-balance text-base text-slate-300 sm:text-lg">
            Magnus Flipper watches Facebook Marketplace, Craigslist and more 24/7 — sending instant alerts when profitable deals appear so you can buy first and flip faster.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button size="lg" className="rounded-full px-6 text-base font-semibold">
            Start 7-day free trial
          </Button>
          <Button size="lg" variant="outline" className="rounded-full border-slate-600 bg-slate-900/60 text-slate-100">
            View demo dashboard
          </Button>
          <p className="text-xs text-slate-400">No card required for trial. Cancel anytime.</p>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-xs text-slate-400">
          <div>
            ⭐⭐⭐⭐⭐ <span className="font-medium text-slate-200">4.9 / 5 from early flippers</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>Live alerts running right now</span>
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute -inset-8 rounded-[32px] bg-gradient-to-tr from-cyan-500/15 via-indigo-500/10 to-fuchsia-500/10 blur-2xl" />
        <div className="relative rounded-[28px] border border-slate-800 bg-slate-950/90 p-4 shadow-2xl shadow-cyan-900/40">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-300">Live Flip Feed</span>
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
              Instant alerts
            </span>
          </div>

          <div className="space-y-3 rounded-2xl bg-slate-900/80 p-3">
            {[1, 2, 3].map((id) => (
              <div
                key={id}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-3"
              >
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-50">iPhone 13 Pro Max • Unlocked</p>
                  <p className="text-xs text-slate-400">Facebook Marketplace • 14km away</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-emerald-300">$420</p>
                  <p className="text-[10px] text-slate-400">Instant match</p>
                </div>
              </div>
            ))}
            <p className="pt-1 text-center text-[11px] text-slate-500">
              Examples for illustration only. Your feed adapts to your flipping strategy.
            </p>
          </div>

          <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500">
            <span>iOS &amp; Android apps coming with v1 launch.</span>
            <span className="rounded-full bg-slate-900/80 px-2 py-1">Built for phone flippers</span>
          </div>
        </div>
      </div>
    </section>
  );
}
