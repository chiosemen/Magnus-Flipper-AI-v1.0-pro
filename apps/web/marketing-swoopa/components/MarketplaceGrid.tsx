"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { MARKETPLACE_PROFILES } from "../data/marketplaces";

const MarketplaceGrid = () => {
  return (
    <section
      id="marketplaces"
      className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14 bg-[#0A0A0A]"
    >
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-white md:text-xl tracking-tight">
            Scanning Marketplaces
          </h2>
          <p className="mt-1 text-xs text-white/80 md:text-[13px] font-medium">
            Each marketplace is tracked with its own fee model, risk profile and
            refresh cadence.
          </p>
        </div>
        <Link
          href="/marketplaces"
          className="hidden md:inline-flex items-center gap-1 text-[#00E5FF] hover:text-[#7B2FFF] text-[11px] font-medium transition-colors"
        >
          View all marketplaces
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 max-w-full overflow-hidden">
        {MARKETPLACE_PROFILES.map((mkt, idx) => (
          <motion.div
            key={mkt.slug}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ delay: idx * 0.03, duration: 0.35 }}
          >
            <Link href={`/marketplaces/${mkt.slug}`} className="block h-full">
              <Card className="group relative flex h-full flex-col border border-white/10 bg-gradient-to-br from-[#121212] via-[#0A0A0A] to-[#121212] shadow-[0_0_25px_rgba(0,0,0,0.9)] transition hover:-translate-y-1 hover:border-[#00E5FF]/80 hover:shadow-[0_0_40px_rgba(0,229,255,0.8)]">
                <CardContent className="flex flex-1 flex-col justify-between gap-3 p-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-extrabold text-white tracking-tight">
                        {mkt.name}
                      </span>
                      <span className="rounded-full bg-[#121212] px-2 py-0.5 text-[10px] text-white/70 font-medium">
                        {mkt.refresh}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-white/80 font-medium">
                      {mkt.tagline}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-white/70">
                    <span className="inline-flex items-center gap-1 font-medium">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#00E5FF]" />
                      Live listings · fee-adjusted profit · risk flags
                    </span>
                    <ArrowUpRight className="h-3 w-3 text-white/50 transition group-hover:text-[#00E5FF]" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default MarketplaceGrid;
