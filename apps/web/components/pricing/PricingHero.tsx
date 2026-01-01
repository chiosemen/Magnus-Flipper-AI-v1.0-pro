export function PricingHero() {
  return (
    <section className="bg-gradient-to-b from-zinc-950 to-zinc-900 px-6 py-16 text-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">
          Plans that match your pace
        </p>
        <h1 className="text-3xl font-bold sm:text-4xl">
          Choose the throughput that fits how you scan
        </h1>
        <p className="text-sm text-zinc-400 sm:text-base">
          Every plan includes live marketplace access, server-side limits, and calm failure
          handling. Upgrade when you need more reach or duration.
        </p>
      </div>
    </section>
  );
}
