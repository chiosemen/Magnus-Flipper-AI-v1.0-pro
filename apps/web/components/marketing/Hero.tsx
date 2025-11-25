import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Hero() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-8 py-12 shadow-2xl shadow-cyan-500/10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.08),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(99,102,241,0.12),transparent_35%)]" />
      <div className="relative grid gap-10 lg:grid-cols-2 lg:items-center">
        <div className="space-y-6">
          <Badge variant="secondary" className="bg-cyan-500/10 text-cyan-200">
            Marketplace Monitor
          </Badge>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl">
            Flip smarter with live alerts, curated feeds, and AI pricing.
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Magnus Flipper watches marketplaces 24/7, surfaces profitable deals, and notifies you the
            instant they match your saved searches.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Button size="lg" asChild>
              <Link href="/searches/new">Start a saved search</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-cyan-500/50 text-cyan-200" asChild>
              <Link href="/dashboard">View dashboard</Link>
            </Button>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-400" />
              Live crawler uptime 99.9%
            </div>
            <div className="h-4 w-px bg-border" />
            <div>Over 25k listings scored weekly</div>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -left-6 -top-6 h-20 w-20 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute -right-10 top-1/3 h-24 w-24 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-slate-900/80 p-6 shadow-xl">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Live feed</span>
              <span>Last updated: 12s</span>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              {[
                { title: "iPhone 15 Pro Max - new in box", price: "$820", source: "FB Marketplace" },
                { title: "MacBook Air M2 - 16GB / 512GB", price: "$980", source: "Craigslist" },
                { title: "PS5 Slim + 2 controllers", price: "$420", source: "OfferUp" },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex items-center justify-between rounded-xl border border-border/40 bg-slate-950/60 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.source}</p>
                  </div>
                  <span className="font-mono text-base text-cyan-200">{item.price}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-lg border border-dashed border-cyan-500/30 bg-cyan-500/5 px-4 py-3 text-xs text-cyan-100">
              “Alert triggered for NYC electronics — 3 high-score matches found.”
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
