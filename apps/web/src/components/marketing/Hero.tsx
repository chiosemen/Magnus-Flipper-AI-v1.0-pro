"use client";

import { Button } from "@/components/ui/button";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-black via-slate-900 to-slate-950 py-20">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 text-center sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
          Magnus Flipper • Real-time marketplace alerts
        </p>
        <h1 className="text-balance text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
          Catch undervalued deals before anyone else.
        </h1>
        <p className="max-w-3xl text-balance text-base text-slate-300 sm:text-lg">
          Magnus monitors Facebook Marketplace, Craigslist, Gumtree and more 24/7, filters spam,
          and fires instant alerts so you can act first and flip faster.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button size="lg" className="rounded-full px-6 text-base font-semibold">
            Start free 7-day trial
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="rounded-full border-slate-700 bg-slate-900/70 text-slate-100"
          >
            View demo dashboard
          </Button>
        </div>
      </div>
    </section>
  );
}
