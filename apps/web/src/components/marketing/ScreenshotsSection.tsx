import { Card, CardContent } from "@/components/ui/card";

export function ScreenshotsSection() {
  return (
    <section className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">One command center for all your flips</h2>
        <p className="mx-auto max-w-2xl text-sm text-slate-300 sm:text-base">
          Saved searches, real-time alerts, live feed and billing all live in a single clean dashboard. Magnus is built
          for phones today — and ready for cars, couches and more tomorrow.
        </p>
      </div>

      <Card className="border-slate-800 bg-slate-950/80">
        <CardContent className="space-y-4 p-4 sm:p-6">
          <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
            <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Live listings feed</span>
                <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] text-emerald-300">
                  Instant alerts ON
                </span>
              </div>
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-50">iPhone 14 Pro • 256GB</p>
                      <p className="text-[11px] text-slate-400">Facebook Marketplace • 8 km • Good condition</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-emerald-300">$520</p>
                      <p className="text-[10px] text-slate-400">Est. flip: $150</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Saved searches</p>
              <div className="space-y-2 text-xs text-slate-200">
                <div className="flex items-center justify-between rounded-lg bg-slate-900/80 px-3 py-2">
                  <span>“iPhone 13+ • Unlocked • &lt;$450”</span>
                  <span className="text-[10px] text-slate-400">3 active alerts</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-900/80 px-3 py-2">
                  <span>“MacBook M1 • 16GB RAM”</span>
                  <span className="text-[10px] text-slate-400">2 active alerts</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-900/80 px-3 py-2">
                  <span>“PS5 Bundle”</span>
                  <span className="text-[10px] text-slate-400">1 active alert</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400">
                Cars, couches and other flipping categories are supported with the same alert logic.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
