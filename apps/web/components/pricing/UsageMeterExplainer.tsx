export function UsageMeterExplainer() {
  return (
    <section className="px-6 py-12">
      <div className="mx-auto max-w-4xl rounded-2xl border border-white/10 bg-zinc-950/70 p-6">
        <h3 className="text-lg font-semibold text-white">Usage and limits</h3>
        <p className="mt-2 text-sm text-zinc-400">
          Usage is measured in scans and duration. Limits are enforced on the server to keep
          latency predictable. If you approach a limit, scans slow gracefully instead of failing
          hard. Upgrade to increase throughput.
        </p>
        <ul className="mt-4 space-y-2 text-sm text-zinc-300">
          <li>• Scans count when fresh data is fetched.</li>
          <li>• Cache hits are lightweight and don&apos;t count toward billable scans.</li>
          <li>• Duration controls how long your session stays active.</li>
        </ul>
      </div>
    </section>
  );
}
