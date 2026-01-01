export function UpgradeCTA() {
  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-cyan-400/10 to-emerald-400/10 p-6 text-center text-white">
      <h3 className="text-xl font-semibold">Need more reach?</h3>
      <p className="mt-2 text-sm text-zinc-300">
        Upgrade to extend session duration, add marketplaces, and lift daily caps. Billing is
        flexible—change plans anytime.
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-center">
        <a
          href="/checkout"
          className="rounded-lg bg-cyan-400 px-5 py-2 text-sm font-semibold text-black hover:bg-cyan-300"
        >
          Go to checkout
        </a>
        <a
          href="/login"
          className="text-sm font-semibold text-cyan-200 hover:text-cyan-100"
        >
          Sign in to manage plan
        </a>
      </div>
    </div>
  );
}
