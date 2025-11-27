import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  MarketingFeatureBlock,
  MarketingHero,
  MarketingPricingCTA,
  MarketingScreenshots,
  MarketingSEO,
} from "@/components/marketing/shared";

export const metadata: Metadata = {
  title: "Flip Phones Fast | Magnus Flipper",
  description: "Real-time mobile alerts, price intelligence, and sourcing playbooks for phone resellers.",
  openGraph: {
    title: "Flip Phones Fast | Magnus Flipper",
    description: "Real-time mobile alerts, price intelligence, and sourcing playbooks for phone resellers.",
    url: "https://magnusflipper.ai/flip/phones",
  },
  alternates: {
    canonical: "https://magnusflipper.ai/flip/phones",
  },
};

export default function PhonesPage() {
  return (
    <div className="bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-12 sm:py-16">
        <MarketingHero
          eyebrow="Phone Flips, Done Right"
          title="Land profitable phone flips before they hit the crowd."
          subtitle="Magnus watches every major marketplace, scores phone listings in real time, and sends you only the deals worth messaging."
          highlights={[
            "2–5 min alert latency",
            "Spam + refurb filters built-in",
            "Carrier, storage, condition tags",
          ]}
          actions={
            <>
              <Button asChild size="lg" className="bg-white text-slate-900 hover:bg-slate-100">
                <Link href="/pricing">Start free trial</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/50 text-white hover:bg-white/10">
                <Link href="/marketplace">View coverage</Link>
              </Button>
            </>
          }
        />

        <MarketingFeatureBlock
          title="Signals you actually need"
          description="Dial in SKUs, carriers, storage, and condition. Magnus suppresses bait posts, carrier locks you dislike, and obvious refurb spam."
          features={[
            { title: "SKU-aware alerts", body: "Track exact iPhone and Android SKUs with storage + carrier filters." },
            { title: "Price confidence", body: "Deal scores with historical comps so you don’t waste time on junk." },
            { title: "Fraud filtering", body: "Flags stolen/too-good-to-be-true listings before they hit your inbox." },
            { title: "Geo radius control", body: "Metro sweeps plus local pickups with adjustable mile radius." },
            { title: "Condition rules", body: "Separate like-new/open-box from repairable flips automatically." },
            { title: "Inbox sanity", body: "No rentals, bots, or bulk dealers — just the phones you flip." },
          ]}
        />

        <MarketingScreenshots
          title="Real-time alerts tuned for phones"
          description="See scored listings, photos, carrier + storage tags, and quick-message links as soon as they surface."
          items={[
            { title: "Alert stream", caption: "Fresh phone listings scored and sorted by profit potential." },
            { title: "Deal cards", caption: "Carrier, storage, condition, and price history at a glance." },
            { title: "Offer coach", caption: "Suggested opening offers with auto-calculated margin." },
          ]}
        />

        <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-lg sm:p-10">
          <div className="space-y-4 sm:flex sm:items-center sm:justify-between sm:space-y-0">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-cyan-200/80">Trust & Speed</p>
              <h2 className="text-2xl font-semibold text-white sm:text-3xl">
                Alerts that hit before the flippers’ group chats do.
              </h2>
              <p className="mt-2 max-w-2xl text-slate-300">
                Magnus runs 24/7 crawlers with adaptive throttling. Expect signals in minutes, not hours, with noise
                filtered out.
              </p>
            </div>
            <div className="grid gap-3 text-sm text-slate-200 sm:text-base">
              <div className="rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3">
                <p className="text-xs uppercase text-cyan-200/80">Latency</p>
                <p className="text-lg font-semibold text-white">2–5 minutes</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3">
                <p className="text-xs uppercase text-cyan-200/80">Signal quality</p>
                <p className="text-lg font-semibold text-white">92% spam removed</p>
              </div>
            </div>
          </div>
        </section>

        <MarketingPricingCTA
          title="Flip phones with verified alerts and price comps."
          description="Start a 7-day trial. Ship faster, message earlier, and stop chasing dead-end listings."
          primaryAction={
            <Button asChild size="lg" className="bg-white text-slate-900 hover:bg-slate-100">
              <Link href="/pricing">See pricing</Link>
            </Button>
          }
          secondaryAction={
            <Button asChild size="lg" variant="outline" className="border-white/60 text-white hover:bg-white/10">
              <Link href="/marketplace">View marketplace coverage</Link>
            </Button>
          }
        />

        <MarketingSEO
          name="Magnus Flipper — Phone Flipping Alerts"
          description="Real-time phone flipping alerts with spam filtering, price comps, and SKU-aware filters."
          url="https://magnusflipper.ai/flip/phones"
        />
      </div>
    </div>
  );
}
