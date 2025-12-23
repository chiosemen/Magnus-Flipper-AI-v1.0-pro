"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { staggerContainer, scaleIn, tapScale } from "@/lib/motion";

const marketplaces = [
  { name: "Facebook Marketplace", color: "hsl(214, 89%, 52%)", initial: "F" },
  { name: "Gumtree", color: "hsl(136, 72%, 41%)", initial: "G" },
  { name: "Vinted", color: "hsl(172, 79%, 42%)", initial: "V" },
  { name: "eBay", color: "hsl(45, 96%, 54%)", initial: "E" },
  { name: "Craigslist", color: "hsl(270, 60%, 55%)", initial: "C" },
  { name: "OfferUp", color: "hsl(199, 89%, 48%)", initial: "O" },
  { name: "Depop", color: "hsl(351, 83%, 61%)", initial: "D" },
  { name: "Mercari", color: "hsl(351, 72%, 56%)", initial: "M" },
  { name: "Letgo", color: "hsl(25, 95%, 53%)", initial: "L" },
  { name: "Nextdoor", color: "hsl(142, 76%, 36%)", initial: "N" },
];

const LovableMarketplaces = () => {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

  return (
    <section id="marketplaces" className="py-20 lg:py-32 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-full mb-4">
            <span className="text-sm font-medium text-accent">Supported Platforms</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Monitor <span className="text-gradient">10+ Marketplaces</span>{" "}
            <br className="hidden sm:block" />
            From One Dashboard
          </h2>
          <p className="text-lg text-muted-foreground">
            We integrate with all the major online marketplaces so you never miss a deal, no matter where it's posted.
          </p>
        </div>

        {/* Marketplace grid */}
        <div className="max-w-4xl mx-auto">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 lg:gap-6"
          >
            {marketplaces.map((marketplace, index) => (
              <motion.button
                key={marketplace.name}
                variants={scaleIn}
                whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
                whileTap={shouldReduceMotion ? {} : tapScale}
                onClick={() => router.push("/register")}
                className="group relative bg-card rounded-2xl p-6 shadow-soft border border-border/50 hover:shadow-card hover:border-accent/30 transition-all duration-300 text-center cursor-pointer"
              >
                {/* Logo placeholder */}
                <div
                  className="w-14 h-14 rounded-xl mx-auto mb-3 flex items-center justify-center text-2xl font-bold text-card transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: marketplace.color }}
                >
                  {marketplace.initial}
                </div>

                {/* Name */}
                <p className="text-sm font-medium text-foreground">
                  {marketplace.name}
                </p>

                {/* Check badge */}
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-accent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-glow">
                  <Check className="w-4 h-4 text-accent-foreground" />
                </div>
              </motion.button>
            ))}
          </motion.div>

          {/* Additional info */}
          <p className="text-center text-muted-foreground mt-8">
            ...and more platforms being added regularly
          </p>
        </div>
      </div>
    </section>
  );
};

export default LovableMarketplaces;

