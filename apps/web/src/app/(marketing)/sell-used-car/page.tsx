import { Metadata } from "next";
import { UsedCarFormClient } from "./UsedCarFormClient";
import { TrackedLink } from "@/components/marketing/TrackedLink";
import { Button } from "@/components/flipbomb/ui/button";

export const metadata: Metadata = {
  title: "Get Dealer Offers for Your Car | Magnus Flipper",
  description: "Compare real dealer offers and arbitrage your used car value.",
};

export default function SellUsedCarPage() {
  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      {/* Hero Section */}
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
          Get Dealer Offers for Your Car
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Compare real dealer offers and arbitrage your used car value. Magnus Flipper helps you find the best deals and maximize your return.
        </p>
      </div>

      {/* Form Section */}
      <div className="mx-auto max-w-3xl">
        <UsedCarFormClient />
      </div>

      {/* Cross-link to other marketing pages */}
      <div className="mx-auto max-w-3xl mt-8 text-center">
        <p className="text-sm text-muted-foreground mb-4">
          Want to scan market demand instead?{" "}
          <TrackedLink href="/flipbomb" intent="secondary" className="text-primary hover:underline">
            Run a deal scan
          </TrackedLink>
        </p>
      </div>
    </div>
  );
}
