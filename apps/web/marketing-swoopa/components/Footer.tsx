"use client";

import Link from "next/link";
import { Zap } from "lucide-react";

const Footer = () => {
  return (
    <footer className="relative py-12 border-t border-white/10 bg-[#121212]/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-[#00E5FF]" />
            <span className="font-heading text-lg font-extrabold text-white tracking-tight">Magnus Flipper AI</span>
          </Link>

          {/* Links */}
          <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <Link href="/marketplaces" className="text-white/70 hover:text-white transition-colors font-medium">Marketplaces</Link>
            <Link href="/pricing" className="text-white/70 hover:text-white transition-colors font-medium">Pricing</Link>
            <Link href="/login" className="text-white/70 hover:text-white transition-colors font-medium">Login</Link>
            <Link href="/register" className="text-white/70 hover:text-white transition-colors font-medium">Get started</Link>
          </nav>

          {/* Copyright */}
          <p className="text-sm text-white/70 font-medium">
            © 2024 Magnus Flipper AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
