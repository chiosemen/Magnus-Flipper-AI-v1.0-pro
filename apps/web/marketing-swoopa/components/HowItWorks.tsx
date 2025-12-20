"use client";

import { Search, Bell, MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useRegion } from "@/providers/RegionProvider";
import { copyForRegion } from "@/lib/copy-config";

const HowItWorks = () => {
  const router = useRouter();
  const [keywords, setKeywords] = useState("");
  const { region } = useRegion();
  const copy = copyForRegion(region);

  const steps = [
    {
      number: "1",
      icon: Search,
      title: "Create Searches",
      description: `${copy.howItWorksExamples} Fine-tune your search by setting price, distance, and condition filters to target only the deals you want.`,
      highlights: ["Select your keywords", "Set price, distance, and condition filters"],
    },
    {
      number: "2",
      icon: Bell,
      title: "Get Alerts First & Fast",
      description: `Magnus Flipper monitors the pooled market feed around the clock. The moment a matching vehicle or item is added to the pool, you'll get an AI Deal Alert so you can move first. ${copy.howItWorksAlertsLine}`,
      highlights: ["Pooled marketplaces monitored 24/7", "Get AI Deal Alerts the moment a match appears"],
    },
    {
      number: "3",
      icon: MessageCircle,
      title: "Close The Deal",
      description: "Open the alert, message the seller immediately, and lock in the deal before anyone else. Use save, compare, and block tools to keep your feed clean and focused.",
      highlights: ["Message the seller before anyone else", "Save, compare, or block listings to keep your feed clean"],
    },
  ];

  return (
    <section id="how-it-works" className="relative py-24 lg:py-32 bg-[#121212]/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16 lg:mb-20">
          <p className="text-[#00E5FF] font-extrabold tracking-widest text-sm mb-4">HOW IT WORKS</p>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            The easiest way to turn alerts into wins
          </h2>

          <form
            className="mt-8 mx-auto flex w-full max-w-xl flex-col gap-3 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              const value = keywords.trim();
              if (!value) return;
              router.push(`/marketplaces/facebook?keywords=${encodeURIComponent(value)}`);
            }}
          >
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder='Try: "iPhone 15 Pro", "PS5", "MacBook"'
              className="w-full flex-1 rounded-xl bg-[#121212] border border-white/10 px-4 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#00E5FF]/50"
            />
            <button
              type="submit"
              className="rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#7B2FFF] px-5 py-3 text-sm font-extrabold text-white shadow-[0_0_40px_rgba(0,229,255,0.25)] hover:shadow-[0_0_60px_rgba(123,47,255,0.35)] transition-all"
            >
              Search Facebook
            </button>
          </form>
          <p className="mt-3 text-xs text-white/60 font-medium">
            Routes you to pooled Facebook results (no scraping triggered).
          </p>
        </div>

        {/* Steps */}
        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <div
              key={index}
              className="relative"
            >
              {/* Connection line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-16 left-full w-full h-[2px] bg-gradient-to-r from-[#00E5FF]/50 to-transparent z-0" />
              )}
              
              <div className="relative z-10 bg-[#121212]/50 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-[#00E5FF]/30 transition-all duration-300 h-full hover:shadow-[0_0_40px_rgba(0,229,255,0.4)]">
                {/* Step number */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 gradient-accent rounded-full flex items-center justify-center text-[#0A0A0A] font-heading font-extrabold text-lg shadow-[0_0_40px_rgba(0,229,255,0.6)]">
                    {step.number}
                  </div>
                  <step.icon className="w-6 h-6 text-[#00E5FF]" />
                </div>
                
                <h3 className="font-heading text-2xl font-extrabold text-white mb-4 tracking-tight">
                  {step.title}
                </h3>
                
                <p className="text-white/80 mb-6 leading-relaxed font-medium">
                  {step.description}
                </p>
                
                <ul className="space-y-3">
                  {step.highlights.map((highlight, hIndex) => (
                    <li key={hIndex} className="flex items-start gap-3 text-sm text-white/80 font-medium">
                      <span className="w-1.5 h-1.5 bg-[#00E5FF] rounded-full mt-2 flex-shrink-0" />
                      {highlight}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
