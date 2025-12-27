import Link from "next/link";
import { ArrowLeft, Zap } from "lucide-react";
import Header from "../../../marketing-swoopa/components/Header";
import Footer from "../../../marketing-swoopa/components/Footer";
import MarketplaceStatus from "../[slug]/MarketplaceStatus";
import MarketplaceSearchBox from "../../../components/marketplace/MarketplaceSearchBox";
import VintedDealsList from "./VintedDealsList";
import SavedSearchesList from "../../../components/SavedSearchesList";

export const metadata = {
  title: "Vinted – Live Deals | Magnus Flipper AI",
  description: "Real-time deal intelligence for Vinted.",
};

export default async function VintedMarketplacePage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Header />
      <main>
        {/* Hero Section */}
        <section className="relative pt-32 pb-16 overflow-hidden bg-[#0A0A0A]">
          <div className="absolute inset-0 gradient-hero" />
          <div className="absolute top-1/2 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-[#00E5FF]/40 to-[#7B2FFF]/40 blur-3xl opacity-30 -translate-y-1/2" />

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-4xl mx-auto">
              <Link
                href="/marketplaces"
                className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm font-medium mb-8 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to all marketplaces
              </Link>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-[#00E5FF]/20 to-[#7B2FFF]/20 rounded-2xl flex items-center justify-center border border-[#00E5FF]/30">
                  <Zap className="w-8 h-8 text-[#00E5FF]" />
                </div>
                <div>
                  <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-2 tracking-tight">
                    Vinted
                  </h1>
                  <p className="text-white/80 text-lg font-medium">
                    Real-time deal intelligence for Vinted
                  </p>
                </div>
              </div>

              <MarketplaceStatus marketplace="vinted" />
            </div>
          </div>
        </section>

        {/* Create Search Section */}
        <section className="py-12 bg-[#0A0A0A]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
              <div className="mb-6">
                <h2 className="text-2xl font-extrabold text-white mb-2 tracking-tight">
                  Create Search
                </h2>
                <p className="text-white/70 text-sm font-medium">
                  Set up a search to automatically find matching deals
                </p>
              </div>
              <div className="bg-[#121212] border border-white/10 rounded-xl p-6">
                <MarketplaceSearchBox defaultMarketplace="vinted" />
              </div>
            </div>
          </div>
        </section>

        {/* Saved Searches Section */}
        <section className="py-12 bg-[#0A0A0A]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="mb-6">
                <h2 className="text-2xl font-extrabold text-white mb-2 tracking-tight">
                  Your Searches
                </h2>
                <p className="text-white/70 text-sm font-medium">
                  Monitor performance and see what's working
                </p>
              </div>
              <SavedSearchesList marketplace="vinted" />
            </div>
          </div>
        </section>

        {/* Live Deals Section */}
        <section className="py-12 bg-[#0A0A0A]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <h2 className="text-2xl font-extrabold text-white mb-2 tracking-tight">
                Live Deals
              </h2>
              <p className="text-white/70 text-sm font-medium">
                Real-time opportunities from Vinted
              </p>
            </div>

            <VintedDealsList />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
