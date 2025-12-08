import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MARKETPLACE_PROFILES } from "../../marketing-swoopa/data/marketplaces";
import MarketplaceGrid from "../../marketing-swoopa/components/MarketplaceGrid";
import Header from "../../marketing-swoopa/components/Header";
import Footer from "../../marketing-swoopa/components/Footer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Marketplaces – Magnus Flipper",
  description:
    "Browse all marketplaces monitored by Magnus Flipper for real-time deal intelligence.",
};

export default function MarketplacesPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Header />
      <main>
        {/* Hero Section */}
        <section className="relative pt-32 pb-16 overflow-hidden bg-[#0A0A0A]">
          <div className="absolute inset-0 gradient-hero" />
          <div className="absolute top-1/2 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-[#00E5FF]/40 to-[#7B2FFF]/40 blur-3xl opacity-30 -translate-y-1/2" />

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm font-medium mb-8 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to home
              </Link>

              <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-6 tracking-tight">
                All Marketplaces
              </h1>
              <p className="text-white/80 text-lg sm:text-xl mb-8 max-w-2xl mx-auto font-medium">
                Magnus Flipper AI monitors {MARKETPLACE_PROFILES.length} marketplaces in
                real-time. Click any marketplace to see live deals and
                opportunities.
              </p>
            </div>
          </div>
        </section>

        {/* Marketplace Grid */}
        <MarketplaceGrid />
      </main>
      <Footer />
    </div>
  );
}
