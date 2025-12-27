import { Radar, Activity, Eye } from "lucide-react";

export default function MarketplaceMonitorSection() {
  return (
    <section className="relative w-full py-20">
      <div className="mx-auto max-w-6xl px-6">

        {/* Header */}
        <div className="mb-14 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-white">
            Marketplace Monitor
          </h2>
          <p className="mt-4 text-lg text-white/70">
            Live feed active the moment listings appear.
          </p>
        </div>

        {/* Monitor Grid */}
        <div className="grid gap-6 md:grid-cols-3">

          {/* Live Surveillance */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-300/10 text-cyan-300">
              <Radar className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-medium text-white">
              Continuous Surveillance
            </h3>
            <p className="mt-3 text-sm text-white/70">
              Magnus monitors marketplaces with instant scan coverage, tracking new
              listings, edits, and price drops in real time.
            </p>
          </div>

          {/* Signal Detection */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-300/10 text-cyan-300">
              <Activity className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-medium text-white">
              Signal-Only Detection
            </h3>
            <p className="mt-3 text-sm text-white/70">
              Listings are scored for pricing anomalies, urgency signals, and
              resale spread — noise never reaches your feed.
            </p>
          </div>

          {/* Human Control */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-300/10 text-cyan-300">
              <Eye className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-medium text-white">
              Human-Controlled Execution
            </h3>
            <p className="mt-3 text-sm text-white/70">
              Magnus never auto-purchases. You receive the signal, assess the deal,
              and decide when to act.
            </p>
          </div>

        </div>

        {/* Flow */}
        <div className="mt-14 text-center text-sm text-white/60">
          Marketplace Monitor
          <span className="mx-2">→</span>
          Deal Signal
          <span className="mx-2">→</span>
          Manual Action
        </div>

      </div>
    </section>
  );
}
