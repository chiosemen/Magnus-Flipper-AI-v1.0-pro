import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CTA() {
  return (
    <section className="rounded-2xl border border-cyan-500/40 bg-gradient-to-r from-cyan-500/10 via-indigo-500/10 to-slate-950/90 p-6 sm:p-8">
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Ready to stop missing profitable deals?
          </h2>
          <p className="max-w-xl text-sm text-slate-200 sm:text-base">
            Start a 7-day free trial, plug in your flipping strategy, and let Magnus watch the marketplaces for you.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button size="lg" className="rounded-full px-6 text-sm font-semibold" asChild>
            <Link href="/signup">Start 7-day free trial</Link>
          </Button>
          <p className="text-xs text-slate-200">No long-term contract. Cancel anytime.</p>
        </div>
      </div>
    </section>
  );
}
