"use client";

import { Star } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { testimonials } from "../data/testimonials";
import { useRegion } from "@/providers/RegionProvider";
import { copyForRegion } from "@/lib/copy-config";

const Testimonials = () => {
  const reducedMotion = useReducedMotion();
  const { region } = useRegion();
  const copy = copyForRegion(region);
  const visible = testimonials.filter((t) => !t.regions || t.regions.includes(region));

  return (
    <section className="relative py-24 lg:py-32 overflow-hidden bg-[#0A0A0A]">
      {/* Background elements */}
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-gradient-to-br from-[#00E5FF]/40 to-[#7B2FFF]/40 blur-3xl opacity-30 -translate-y-1/2" />
      <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-gradient-to-br from-[#00E5FF]/40 to-[#7B2FFF]/40 blur-3xl opacity-30 -translate-y-1/2" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            {copy.testimonialsHeading}
          </h2>
        </div>

        {/* Testimonial cards - Horizontal scroll carousel */}
        <div className="overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
          <div className="flex gap-6 md:grid md:grid-cols-2 md:max-w-5xl md:mx-auto">
            {visible.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={reducedMotion ? false : { opacity: 0, x: -20 }}
                whileInView={reducedMotion ? undefined : { opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={reducedMotion ? undefined : { delay: index * 0.15, duration: 0.5 }}
                className="relative gradient-card rounded-2xl p-8 lg:p-10 border border-white/10 hover:border-[#00E5FF]/30 transition-all duration-300 hover:shadow-[0_0_40px_rgba(0,229,255,0.4)] min-w-[300px] md:min-w-0 flex-shrink-0 md:flex-shrink"
              >
              {/* Stars */}
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-[#00E5FF] fill-[#00E5FF]" />
                ))}
              </div>
              
              {/* Highlight */}
              <h3 className="font-heading text-xl font-extrabold text-white mb-4 tracking-tight">
                {testimonial.highlight}
              </h3>
              
              {/* Quote */}
              <blockquote className="text-white/80 leading-relaxed mb-8 font-medium">
                "{testimonial.quote}"
              </blockquote>
              
              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#121212] rounded-full flex items-center justify-center">
                  <span className="text-white font-heading font-extrabold text-lg">
                    {testimonial.name[0]}
                  </span>
                </div>
                <div>
                  <p className="font-extrabold text-white">{testimonial.name}</p>
                  <p className="text-sm text-white/70 font-medium">{testimonial.role}</p>
                </div>
              </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
