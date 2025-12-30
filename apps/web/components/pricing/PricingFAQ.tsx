const FAQ = [
  {
    q: "Can I start on the lowest tier and upgrade later?",
    a: "Yes. Upgrade at any time to extend session duration or add marketplaces.",
  },
  {
    q: "Do cache hits count toward limits?",
    a: "No. Only fresh scans count toward billable usage; cached responses stay lightweight.",
  },
  {
    q: "What happens at the limit?",
    a: "We slow gracefully and prompt you to upgrade rather than fail requests.",
  },
];

export function PricingFAQ() {
  return (
    <section className="px-6 py-12">
      <div className="mx-auto max-w-4xl space-y-6 rounded-2xl border border-white/10 bg-zinc-950/60 p-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Frequently asked</h3>
          <p className="text-sm text-zinc-400">
            Straight answers about usage, upgrades, and limits.
          </p>
        </div>
        <div className="space-y-4">
          {FAQ.map((item) => (
            <div key={item.q} className="rounded-xl border border-white/5 bg-black/30 p-4">
              <p className="text-sm font-semibold text-white">{item.q}</p>
              <p className="mt-2 text-sm text-zinc-400">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
