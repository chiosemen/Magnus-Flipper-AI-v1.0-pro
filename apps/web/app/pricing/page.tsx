import Link from "next/link";

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#070B12] text-white">
      {/* Header */}
      <section className="px-6 pt-28 pb-20 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-cyan-300/80 tracking-widest text-xs mb-3">
            PRICING
          </p>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            Choose your scan power.
          </h1>
          <p className="text-white/70 max-w-2xl mx-auto">
            Pricing is based on scan intensity and marketplace coverage.
            Start lean. Upgrade when speed and volume matter.
          </p>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* OFFER 1 */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 flex flex-col transition-all duration-300 ease-out hover:bg-white/10 hover:border-cyan-300/40">
            <h3 className="text-lg font-semibold mb-2">
              Facebook Starter
            </h3>
            <p className="text-4xl font-black mb-1">£30</p>
            <p className="text-sm text-white/60 mb-4">
              Validate the loop on Facebook Marketplace.
            </p>

            <ul className="text-sm text-white/80 space-y-2 mb-6">
              <li>• Facebook Marketplace only</li>
              <li>• 3 saved searches</li>
              <li>• 1 instant scan OR 5-minute cadence</li>
              <li>• Email alerts</li>
              <li>• 7-day free trial</li>
            </ul>

            <Link
              href="/register"
              className="mt-auto inline-flex items-center justify-center rounded-md border border-white/20 px-4 py-2 text-sm transition-all duration-200 hover:bg-white/10 hover:border-cyan-300/40 active:scale-[0.98]"
            >
              Start Starter →
            </Link>
          </div>

          {/* OFFER 2 */}
          <div className="rounded-xl border border-cyan-400/30 bg-cyan-400/[0.06] p-6 flex flex-col relative transition-all duration-300 ease-out hover:bg-cyan-400/[0.10] hover:border-cyan-300/50">
            <div className="absolute top-4 right-4 text-xs bg-cyan-300 text-black px-2 py-1 rounded-full">
              Most Popular
            </div>

            <h3 className="text-lg font-semibold mb-2">
              Facebook Power
            </h3>
            <p className="text-4xl font-black mb-1">£100</p>
            <p className="text-sm text-white/70 mb-4">
              For flippers who need speed on Facebook.
            </p>

            <ul className="text-sm text-white/90 space-y-2 mb-4">
              <li>• Facebook Marketplace only</li>
              <li>• 5 instant searches</li>
              <li>• Live signal coverage</li>
              <li>• Priority alerts</li>
              <li>• Pooled + personal searches</li>
            </ul>

            <div className="mb-6">
              <span className="inline-flex items-center gap-2 text-xs text-cyan-300">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-cyan-300 opacity-75 animate-ping"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-300"></span>
                </span>
                Live signal active
              </span>
            </div>

            <Link
              href="/register"
              className="mt-auto inline-flex items-center justify-center rounded-md bg-cyan-300 text-black px-4 py-2 text-sm font-medium transition-all duration-200 hover:bg-cyan-200 hover:shadow-[0_0_0_4px_rgba(79,240,230,0.15)] active:scale-[0.98]"
            >
              Go Power →
            </Link>
          </div>

          {/* OFFER 3 */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 flex flex-col transition-all duration-300 ease-out hover:bg-white/10 hover:border-cyan-300/40">
            <h3 className="text-lg font-semibold mb-2">
              Multi-Marketplace Pro
            </h3>
            <p className="text-4xl font-black mb-1">£250–£300</p>
            <p className="text-sm text-white/60 mb-4">
              Serious operators scanning multiple platforms.
            </p>

            <ul className="text-sm text-white/80 space-y-2 mb-6">
              <li>• Facebook, Gumtree, Vinted, eBay, OfferUp</li>
              <li>• 5 instant searches</li>
              <li>• Live signal coverage</li>
              <li>• Live deal feed + snapshots</li>
              <li>• Signal quality filtering</li>
            </ul>

            <Link
              href="/register"
              className="mt-auto inline-flex items-center justify-center rounded-md border border-white/20 px-4 py-2 text-sm transition-all duration-200 hover:bg-white/10 hover:border-cyan-300/40 active:scale-[0.98]"
            >
              Go Pro →
            </Link>
          </div>
        </div>

        {/* Custom Offer */}
        <div className="mt-16 rounded-xl border border-white/10 bg-white/[0.03] p-8 text-center transition-all duration-300 ease-out hover:bg-white/10 hover:border-cyan-300/40">
          <h3 className="text-2xl font-semibold mb-2">
            High-Volume / Custom
          </h3>
          <p className="text-white/70 mb-4 max-w-xl mx-auto">
            For agencies, dealers, or arbitrage teams running continuous scans
            across all marketplaces.
          </p>

          <ul className="text-sm text-white/80 space-y-1 mb-6">
            <li>• 10+ instant searches</li>
            <li>• Live signal or continuous refresh</li>
            <li>• All marketplaces enabled</li>
            <li>• Custom limits & support</li>
          </ul>

          <Link
            href="mailto:sales@magnusflipper.ai"
            className="inline-flex items-center justify-center rounded-md bg-white text-black px-6 py-2 text-sm font-medium transition-all duration-200 hover:bg-white/90 hover:shadow-[0_0_0_4px_rgba(255,255,255,0.15)] active:scale-[0.98]"
          >
            Contact for Custom →
          </Link>
        </div>

        {/* Affiliate Note */}
        <div className="mt-20 text-center text-sm text-white/50">
          <p>
            Affiliate program available —{" "}
            <span className="text-white/70">
              20% standard · 30% premium partners
            </span>
          </p>
        </div>

        {/* Trust Section */}
        <section className="mt-20 border-t border-white/10 pt-14">
          <div className="max-w-3xl text-sm text-white/60 space-y-4">
            <p>
              Pricing reflects real infrastructure cost.
            </p>
            <p>
              Each scan consumes external marketplace resources and third-party
              extraction credits. Limits exist by design to maintain reliability.
            </p>
            <p>
              Higher tiers unlock broader marketplace coverage and longer monitoring
              signals — not artificial feature gates.
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}
