"use client";

import { Button } from "@/components/flipbomb/ui/button";
import { Search, TrendingUp, Zap } from "lucide-react";
import { useConversionPath } from "@/lib/hooks/useConversionPath";

interface HeroSectionProps {
  onGetStarted: () => void;
}

export function HeroSection({ onGetStarted }: HeroSectionProps) {
  const { trackClick } = useConversionPath();

  const handleGetStarted = () => {
    trackClick({
      source: window.location.pathname,
      target: window.location.pathname,
      intent: "primary",
    });
    onGetStarted();
  };

  return (
    <section className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="space-y-6 max-w-3xl">
        <div className="flex justify-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Zap className="w-4 h-4" />
            Fast & Easy
          </span>
        </div>
        
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
          Scan <span className="text-primary">Market Demand</span>
        </h1>
        
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          AI-powered resale & arbitrage intelligence. Discover real-time market prices and find profitable deals across marketplaces.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Button 
            size="lg" 
            onClick={handleGetStarted}
            className="text-lg px-8 py-6 font-semibold hover:scale-105 transition-transform"
          >
            <Search className="w-5 h-5 mr-2" />
            Run Deal Scan
          </Button>
        </div>
        
        <div className="flex flex-wrap justify-center gap-8 pt-8 text-muted-foreground">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" />
            <span>Multi-Marketplace</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <span>Real-Time Data</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <span>Arbitrage Intelligence</span>
          </div>
        </div>
      </div>
    </section>
  );
}
