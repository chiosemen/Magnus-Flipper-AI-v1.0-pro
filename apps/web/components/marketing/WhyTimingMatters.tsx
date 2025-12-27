export default function WhyTimingMatters() {
  return (
    <div className="mx-auto max-w-4xl mb-12 rounded-2xl border border-white/10 bg-white/5 p-8">
      <h3 className="text-xl font-semibold text-white mb-3">
        Why Timing Matters
      </h3>
      <p className="text-white/70 text-base mb-6">
        Most profitable listings appear and disappear within minutes.
        Magnus runs with live signals so you see deals while sellers are still responsive.
      </p>

      {/* Simple 3-step flow */}
      <div className="flex items-center justify-center gap-4 text-sm text-white/60">
        <span className="font-medium text-white">Live signal</span>
        <span>→</span>
        <span className="font-medium text-white">Deal Found</span>
        <span>→</span>
        <span className="font-medium text-white">You Decide</span>
      </div>
    </div>
  );
}
