"use client";

import { Button } from "../flipbomb/ui/button";
import { Search, Bell, Zap, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { fadeUp, hoverScale, tapScale, pulseOnce } from "@/lib/motion";

const LovableHero = () => {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative min-h-screen gradient-hero pt-20 lg:pt-24 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center pt-12 lg:pt-20">
          {/* Badge */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-full mb-6"
          >
            <div className="w-2 h-2 bg-accent rounded-full animate-pulse-slow" />
            <span className="text-sm font-medium text-accent">#1 Marketplace Monitoring Tool</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground mb-6"
          >
            Instant Marketplace{" "}
            <span className="text-gradient">Alerts</span>.{" "}
            <br className="hidden sm:block" />
            Every Time.
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8"
          >
            Magnus Flipper AI tracks listings across Gumtree, Facebook Marketplace, Vinted & more — get instant notifications on profitable items before anyone else.
          </motion.p>

          {/* Search Demo */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.3 }}
            className="max-w-xl mx-auto mb-8"
          >
            <div className="relative">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  router.push("/register");
                }}
                className="flex items-center bg-card rounded-2xl shadow-card border border-border/50 p-2"
              >
                <div className="flex-1 flex items-center gap-3 px-4">
                  <Search className="w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="What are you looking for? e.g., iPhone 15, Nintendo Switch..."
                    className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground py-3"
                  />
                </div>
                <motion.div
                  whileHover={shouldReduceMotion ? {} : hoverScale}
                  whileTap={shouldReduceMotion ? {} : tapScale}
                  variants={pulseOnce}
                  initial="initial"
                  animate="pulse"
                >
                  <Button type="submit" variant="default" size="lg" className="shrink-0">
                    Create Alert
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </motion.div>
              </form>
            </div>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground"
          >
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-accent" />
              <span>Real-time alerts</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-accent" />
              <span>10+ marketplaces</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded-full bg-muted border-2 border-card"
                    style={{ backgroundColor: `hsl(${200 + i * 20} 60% ${50 + i * 5}%)` }}
                  />
                ))}
              </div>
              <span>2,500+ active users</span>
            </div>
          </motion.div>
        </div>

        {/* Hero Image/Mockup */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.5 }}
          className="mt-12 lg:mt-16 max-w-5xl mx-auto"
        >
          <div className="relative">
            {/* Phone mockups */}
            <div className="flex items-end justify-center gap-4 md:gap-8">
              {/* Left phone */}
              <div className="hidden md:block w-48 lg:w-56 transform -rotate-6 animate-float" style={{ animationDelay: "0.5s" }}>
                <div className="bg-card rounded-3xl shadow-elevated p-3 border border-border/50">
                  <div className="bg-muted rounded-2xl aspect-[9/16] flex flex-col p-4">
                    <div className="text-xs font-medium text-foreground mb-2">New Listing!</div>
                    <div className="flex-1 bg-background/50 rounded-lg mb-2" />
                    <div className="h-3 bg-muted-foreground/20 rounded w-3/4 mb-1" />
                    <div className="h-3 bg-accent/30 rounded w-1/2" />
                  </div>
                </div>
              </div>

              {/* Center phone (main) */}
              <div className="w-60 md:w-72 lg:w-80 z-10 animate-float">
                <div className="bg-card rounded-3xl shadow-elevated p-3 border border-border/50">
                  <div className="bg-muted rounded-2xl aspect-[9/16] flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="bg-primary p-4 text-primary-foreground">
                      <div className="text-sm font-semibold">Magnus Flipper AI</div>
                      <div className="text-xs opacity-80">3 new matches</div>
                    </div>
                    {/* Listing cards */}
                    <div className="flex-1 p-3 space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-card rounded-lg p-3 shadow-soft border border-border/30">
                          <div className="flex gap-3">
                            <div className="w-12 h-12 bg-accent/10 rounded-lg" />
                            <div className="flex-1">
                              <div className="h-2.5 bg-foreground/20 rounded w-3/4 mb-1.5" />
                              <div className="h-2 bg-muted-foreground/20 rounded w-1/2 mb-1" />
                              <div className="h-2.5 bg-accent rounded w-1/3" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right phone */}
              <div className="hidden md:block w-48 lg:w-56 transform rotate-6 animate-float" style={{ animationDelay: "1s" }}>
                <div className="bg-card rounded-3xl shadow-elevated p-3 border border-border/50">
                  <div className="bg-muted rounded-2xl aspect-[9/16] flex flex-col p-4">
                    <div className="text-xs font-medium text-foreground mb-2">Alert Settings</div>
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-8 h-4 bg-accent rounded-full" />
                          <div className="h-2 bg-muted-foreground/20 rounded flex-1" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default LovableHero;

