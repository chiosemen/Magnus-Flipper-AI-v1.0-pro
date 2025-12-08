"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Button } from "../components/ui/button";
import { Check, Play, Smartphone, Zap, TrendingUp, BarChart3 } from "lucide-react";
import Image from "next/image";

const Hero = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [5, -5]));
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-5, 5]));

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      const x = (clientX / innerWidth - 0.5) * 2;
      const y = (clientY / innerHeight - 0.5) * 2;
      setMousePosition({ x, y });
      mouseX.set(x);
      mouseY.set(y);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-20 bg-[#0A0A0A]">
      {/* Background gradient */}
      <div className="absolute inset-0 gradient-hero" />
      
      {/* Glow effects with parallax */}
      <motion.div 
        className="absolute top-1/2 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-[#00E5FF]/40 to-[#7B2FFF]/40 blur-3xl opacity-60 -translate-y-1/2"
        style={{
          x: useTransform(mouseX, [-1, 1], [-20, 20]),
          y: useTransform(mouseY, [-1, 1], [-20, 20]),
        }}
      />
      <motion.div 
        className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-[#00E5FF]/40 to-[#7B2FFF]/40 blur-3xl opacity-40"
        style={{
          x: useTransform(mouseX, [-1, 1], [20, -20]),
          y: useTransform(mouseY, [-1, 1], [20, -20]),
        }}
      />
      
      {/* Floating icons with parallax */}
      <motion.div
        className="absolute top-20 right-20 w-12 h-12 text-[#00E5FF]/30"
        animate={{
          y: [0, -20, 0],
          rotate: [0, 10, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          x: useTransform(mouseX, [-1, 1], [10, -10]),
        }}
      >
        <Zap className="w-full h-full" />
      </motion.div>
      
      <motion.div
        className="absolute top-40 left-10 w-10 h-10 text-[#7B2FFF]/30"
        animate={{
          y: [0, 15, 0],
          rotate: [0, -10, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
        style={{
          x: useTransform(mouseX, [-1, 1], [-15, 15]),
        }}
      >
        <TrendingUp className="w-full h-full" />
      </motion.div>
      
      <motion.div
        className="absolute bottom-40 left-1/4 w-8 h-8 text-[#00E5FF]/20"
        animate={{
          y: [0, -25, 0],
          rotate: [0, 15, 0],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
        style={{
          x: useTransform(mouseX, [-1, 1], [20, -20]),
        }}
      >
        <BarChart3 className="w-full h-full" />
      </motion.div>
      
      {/* Dark fade vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0A0A0A]/60 pointer-events-none" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Left content */}
          <div className="max-w-2xl w-full">
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-tight mb-6 tracking-tight break-words">
              <span className="text-white/70 tracking-wider text-2xl sm:text-3xl lg:text-4xl block mb-2">
                BE FIRST. BUY SMART.
              </span>
              <span className="text-white">Win Every Deal.</span>
            </h1>
            
            <p className="text-white/80 text-lg sm:text-xl mb-8 max-w-xl font-medium break-words">
              Magnus Flipper automatically scans every marketplace in real-time. Get AI Deal Alerts from Facebook, Craigslist, OfferUp, Kijiji, Gumtree, Nextdoor, and eBay so you message the seller before anyone else even sees the listing.
            </p>

            <p className="text-[#00E5FF] font-extrabold tracking-widest text-sm mb-6">
              DOMINATE WITH MAGNUS FLIPPER
            </p>

            {/* App store buttons */}
            <div className="flex flex-wrap gap-4 mb-8">
              <Button variant="secondary" size="xl" className="gap-3 bg-[#121212]/80 hover:bg-[#121212] border border-white/10" asChild>
                <Link href="/register">
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  <div className="text-left">
                    <div className="text-xs text-white/70 font-medium">Available on the</div>
                    <div className="font-extrabold text-white">App Store</div>
                  </div>
                </Link>
              </Button>
              
              <Button variant="secondary" size="xl" className="gap-3 bg-[#121212]/80 hover:bg-[#121212] border border-white/10" asChild>
                <Link href="/register">
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/>
                  </svg>
                  <div className="text-left">
                    <div className="text-xs text-white/70 font-medium">GET IT ON</div>
                    <div className="font-extrabold text-white">Google Play</div>
                  </div>
                </Link>
              </Button>
              
              <Button variant="heroOutline" size="xl" className="gap-2 border-2 border-[#00E5FF]/50 bg-[#00E5FF]/5 text-white hover:bg-[#00E5FF]/10 hover:border-[#00E5FF] backdrop-blur-sm" asChild>
                <Link href="#how-it-works">
                  <Play className="w-5 h-5" />
                  See how it works
                </Link>
              </Button>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-6 text-sm text-white/80 font-medium">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-[#00E5FF]" />
                <span>Free trial - Full access for 7 days</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-[#00E5FF]" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>

          {/* Right content - Product mockup */}
          <div className="relative lg:pl-8">
            {/* Main product card */}
            <div className="relative">
              {/* Floating notification card */}
              <div className="absolute -top-4 left-0 right-0 mx-auto w-[320px] bg-[#121212]/90 backdrop-blur-xl rounded-2xl p-4 shadow-[0_0_40px_rgba(0,229,255,0.4)] border border-white/10 animate-float z-20">
                <div className="flex gap-4">
                  <div className="w-20 h-20 bg-[#121212] rounded-xl flex items-center justify-center overflow-hidden border border-white/10">
                    <Smartphone className="w-10 h-10 text-white/70" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-extrabold text-white mb-1">Toyota Camry GLE</h4>
                    <div className="w-24 h-2 bg-white/10 rounded mb-3" />
                    <div className="flex items-center gap-2">
                      <span className="bg-[#00E5FF]/20 text-[#00E5FF] text-xs font-extrabold px-2 py-1 rounded flex items-center gap-1">
                        <span className="text-[10px]">AI</span>
                        Steal!
                      </span>
                      <div className="w-8 h-8 bg-[#1877F2] rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main car image area with 3D tilt */}
              <motion.div 
                className="mt-32 bg-gradient-to-br from-[#121212]/50 to-transparent rounded-3xl p-8 border border-white/10"
                style={{
                  rotateX,
                  rotateY,
                  transformStyle: "preserve-3d",
                }}
              >
                <div className="bg-[#121212]/30 rounded-2xl p-6 mb-4 border border-white/10">
                  <div className="flex items-center gap-2 text-sm text-white/80 font-medium mb-4">
                    <div className="w-3 h-3 bg-[#00E5FF] rounded-full animate-pulse-glow" />
                    <span>8 mi from central Dallas, TX</span>
                  </div>
                  <div className="space-y-2">
                    <div className="w-full h-3 bg-white/10 rounded" />
                    <div className="w-3/4 h-3 bg-white/10 rounded" />
                    <div className="w-1/2 h-3 bg-white/10 rounded" />
                  </div>
                </div>
                
                {/* Car image */}
                <div className="relative h-48 rounded-2xl overflow-hidden">
                  <Image 
                    src="/marketing-swoopa/assets/magnus-hero.png" 
                    alt="Toyota Camry - Deal found by Magnus Flipper" 
                    fill
                    className="object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/60 to-transparent" />
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
