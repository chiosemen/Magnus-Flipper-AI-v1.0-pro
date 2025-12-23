"use client";

import { Bell, Filter, Zap, Shield, MapPin, Clock } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { staggerContainer, fadeUp, hoverLift, tapScale } from "@/lib/motion";

const features = [
  {
    icon: Bell,
    title: "Instant Push Notifications",
    description: "Get real-time alerts the moment a listing matches your search criteria. Never miss a deal again.",
  },
  {
    icon: Filter,
    title: "Smart Spam Filters",
    description: "Our AI filters out spam and irrelevant posts, showing you only the listings that truly matter.",
  },
  {
    icon: Zap,
    title: "Lightning Fast Scans",
    description: "Our cloud-based system continuously monitors marketplaces 24/7, so you're always first to know.",
  },
  {
    icon: Shield,
    title: "Central Results Dashboard",
    description: "View all listings from multiple marketplaces in one unified feed. No more platform switching.",
  },
  {
    icon: MapPin,
    title: "Location-Based Search",
    description: "Set your preferred location and search radius. Browse locally or expand your reach nationwide.",
  },
  {
    icon: Clock,
    title: "Automated Tracking",
    description: "Set up your searches once and let Magnus do the work. Sit back while we monitor for you.",
  },
];

const LovableFeatures = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section id="features" className="py-20 lg:py-32 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 -left-20 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-full mb-4">
            <span className="text-sm font-medium text-accent">Powerful Features</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Unlock the Power of{" "}
            <span className="text-gradient">Effortless</span> Monitoring
          </h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to find the best marketplace deals, all in one powerful platform.
          </p>
        </div>

        {/* Features grid */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
        >
          {features.map((feature, index) => (
            <motion.button
              key={feature.title}
              variants={fadeUp}
              initial={hoverLift.rest}
              whileHover={shouldReduceMotion ? {} : "hover"}
              whileTap={shouldReduceMotion ? {} : tapScale}
              onClick={() => window.location.href = "/register"}
              className="group bg-card rounded-2xl p-6 lg:p-8 shadow-soft border border-border/50 hover:shadow-card hover:border-accent/30 transition-all duration-300 cursor-pointer text-left w-full"
            >
              {/* Icon */}
              <div className="w-14 h-14 rounded-xl gradient-accent flex items-center justify-center mb-6 group-hover:shadow-glow transition-shadow duration-300">
                <feature.icon className="w-7 h-7 text-accent-foreground" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold text-foreground mb-3 group-hover:text-accent transition-colors duration-300">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.button>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default LovableFeatures;

