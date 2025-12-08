"use client";

import Link from "next/link";
import { Zap } from "lucide-react";
import { Button } from "@swoopa/components/ui/button";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative">
              <Zap className="w-8 h-8 text-[#00E5FF] transition-transform group-hover:scale-110" />
              <div className="absolute inset-0 bg-[#00E5FF]/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="font-heading text-xl font-extrabold text-white tracking-tight">Magnus Flipper</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Link href="/" className="px-4 py-2 text-sm font-medium text-white bg-[#121212] rounded-full transition-colors">
              HOME
            </Link>
            <a href="#features" className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors" onClick={(e) => { e.preventDefault(); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); }}>
              ABOUT
            </a>
            <Link href="/marketplaces" className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors">
              MARKETPLACES
            </Link>
            <Link href="/register" className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors">
              SIGN UP
            </Link>
            <Link href="/mm-agent" className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors">
              MM AGENT
            </Link>
          </nav>

          {/* CTA Button */}
          <Button variant="hero" size="lg" className="hidden sm:flex bg-gradient-to-r from-[#00E5FF] to-[#7B2FFF] hover:from-[#00E5FF]/90 hover:to-[#7B2FFF]/90 text-white font-extrabold shadow-[0_0_40px_rgba(0,229,255,0.4)] hover:shadow-[0_0_60px_rgba(123,47,255,0.5)] transition-all" asChild>
            <Link href="/register">
              Get started
              <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </Button>

          {/* Mobile menu button */}
          <button className="md:hidden p-2 text-white">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
