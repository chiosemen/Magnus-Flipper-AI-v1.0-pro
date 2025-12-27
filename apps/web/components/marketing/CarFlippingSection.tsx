import { CheckCircle, Zap, Timer } from "lucide-react";

export default function CarFlippingSection() {
  return (
    <section className="relative w-full py-20">
      <div className="mx-auto max-w-6xl px-6">

        {/* Section Header */}
        <div className="mb-14 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-white">
            Built for Car Flippers Who Move First
          </h2>
          <p className="mt-4 text-lg text-white/70">
            Magnus scans live marketplaces with live signals to surface
            underpriced vehicles before competition reacts.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid gap-6 md:grid-cols-3">

          {/* Card 1 */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-300/10 text-cyan-300">
              <Timer className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-medium text-white">
              Instant Scan Signals
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-white/70">
              <li>• Live signal keeps scans synced</li>
              <li>• Live feed active, no stale listings</li>
              <li>• Results updating before the crowd</li>
            </ul>
          </div>

          {/* Card 2 */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-300/10 text-cyan-300">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-medium text-white">
              Deal-Grade Filtering
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-white/70">
              <li>• AI flags underpriced vehicles instantly</li>
              <li>• Margin-aware pricing logic</li>
              <li>• Noise filtered out by design</li>
            </ul>
          </div>

          {/* Card 3 */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-300/10 text-cyan-300">
              <CheckCircle className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-medium text-white">
              You Decide the Move
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-white/70">
              <li>• No auto-buying or forced actions</li>
              <li>• No locked commitments</li>
              <li>• Full control over every flip</li>
            </ul>
          </div>
        </div>

        {/* Proof / Testimonial */}
        <div className="mx-auto mt-16 max-w-3xl rounded-xl border border-cyan-300/30 bg-cyan-300/5 p-6 text-center">
          <p className="text-base italic text-white/80">
            "Found two underpriced listings in my first week that I would've
            missed manually. One flip covered the entire month."
          </p>
          <p className="mt-4 text-sm text-white/60">
            — Independent Car Flipper
          </p>
        </div>

        {/* Micro Flow */}
        <div className="mt-14 text-center text-sm text-white/60">
          <span className="font-medium text-white">Live signal</span>
          <span className="mx-2">→</span>
          <span className="font-medium text-white">Deal Found</span>
          <span className="mx-2">→</span>
          <span className="font-medium text-white">You Decide</span>
        </div>

      </div>
    </section>
  );
}
