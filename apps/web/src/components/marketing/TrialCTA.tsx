"use client";

import { Button } from "@/components/ui/button";

export function TrialCTA() {
  return (
    <section className="rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 via-indigo-500/10 to-slate-950/90 p-6 sm:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <h3 className="text-2xl font-semibold text-white">Ready to stop missing flips?</h3>
          <p className="text-sm text-slate-200">
            Start a 7-day free trial. No card required to explore the dashboard.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button className="rounded-full px-6" asChild>
            <a href="/pricing">Start free trial</a>
          </Button>
          <Button variant="outline" className="rounded-full border-slate-700" asChild>
            <a href="/searches/new">Create a saved search</a>
          </Button>
        </div>
      </div>
    </section>
  );
}
