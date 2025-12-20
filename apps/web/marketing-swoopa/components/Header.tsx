"use client";

import Link from "next/link";
import { Zap } from "lucide-react";
import { useState } from "react";
import { Button } from "../components/ui/button";
import NotificationBell from "@/components/NotificationBell";
import { useAuth } from "@/providers/AuthProvider";
import { useRegion } from "@/providers/RegionProvider";

const Header = () => {
  const { user, openAuthModal, signOut } = useAuth();
  const { region, setRegion } = useRegion();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
          <nav className="hidden md:flex items-center gap-2">
            <Link href="/" className="px-4 py-2 text-sm font-medium text-white bg-[#121212] rounded-full transition-colors">
              HOME
            </Link>
            <a href="#features" className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors" onClick={(e) => { e.preventDefault(); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); }}>
              ABOUT
            </a>
            <Link href="/marketplaces" className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors">
              MARKETPLACES
            </Link>
            <Link href="/live" className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors">
              LIVE
            </Link>
            <Link href="/templates" className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors">
              TEMPLATES
            </Link>
            <Link href="/support" className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors">
              SUPPORT
            </Link>
            <Link href="/marketplaces/cars" className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors">
              CAR TRADE
            </Link>
            {user ? (
              <Link href="/settings/notifications" className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors">
                ALERTS
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => openAuthModal("login")}
                className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors"
              >
                ALERTS
              </button>
            )}
            {!user ? (
              <button
                type="button"
                onClick={() => openAuthModal("login")}
                className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors"
              >
                LOGIN
              </button>
            ) : (
              <button
                type="button"
                onClick={() => signOut()}
                className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors"
              >
                LOGOUT
              </button>
            )}
            <Link href="/register" className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors">
              SIGN UP
            </Link>
            <Link href="/tech-trade" className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors">
              TRADE TECH
            </Link>

            {/* Region switcher (US/UK). UI-only; drives read queries via `?region=` */}
            <div className="ml-2 inline-flex items-center gap-1 rounded-full bg-[#121212] border border-white/10 p-1">
              <button
                type="button"
                onClick={() => setRegion("US")}
                className={`px-3 py-1 rounded-full text-xs font-extrabold transition-colors ${
                  region === "US" ? "bg-white/10 text-white" : "text-white/60 hover:text-white"
                }`}
                aria-pressed={region === "US"}
              >
                US
              </button>
              <button
                type="button"
                onClick={() => setRegion("UK")}
                className={`px-3 py-1 rounded-full text-xs font-extrabold transition-colors ${
                  region === "UK" ? "bg-white/10 text-white" : "text-white/60 hover:text-white"
                }`}
                aria-pressed={region === "UK"}
              >
                UK
              </button>
            </div>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <NotificationBell />

            {/* CTA Button */}
            <Button variant="hero" size="lg" className="hidden sm:flex bg-gradient-to-r from-[#00E5FF] to-[#7B2FFF] hover:from-[#00E5FF]/90 hover:to-[#7B2FFF]/90 text-white font-extrabold shadow-[0_0_40px_rgba(0,229,255,0.4)] hover:shadow-[0_0_60px_rgba(123,47,255,0.5)] transition-all" asChild>
              <Link href="/register">
                Get started
                <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden p-2 text-white"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 py-4 space-y-2">
            <Link
              href="/"
              className="block px-4 py-2 text-sm font-medium text-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              HOME
            </Link>
            <button
              type="button"
              className="block w-full text-left px-4 py-2 text-sm font-medium text-white/80 hover:text-white"
              onClick={() => {
                setMobileMenuOpen(false);
                document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              ABOUT
            </button>
            <Link
              href="/marketplaces"
              className="block px-4 py-2 text-sm font-medium text-white/80 hover:text-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              MARKETPLACES
            </Link>
            <Link
              href="/live"
              className="block px-4 py-2 text-sm font-medium text-white/80 hover:text-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              LIVE
            </Link>
            <Link
              href="/templates"
              className="block px-4 py-2 text-sm font-medium text-white/80 hover:text-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              TEMPLATES
            </Link>
            <Link
              href="/support"
              className="block px-4 py-2 text-sm font-medium text-white/80 hover:text-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              SUPPORT
            </Link>
            <Link
              href="/tech-trade"
              className="block px-4 py-2 text-sm font-medium text-white/80 hover:text-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              TRADE TECH
            </Link>
            <Link
              href="/marketplaces/cars"
              className="block px-4 py-2 text-sm font-medium text-white/80 hover:text-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              CAR TRADE
            </Link>
            {user ? (
              <Link
                href="/settings/notifications"
                className="block px-4 py-2 text-sm font-medium text-white/80 hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                ALERTS
              </Link>
            ) : (
              <button
                type="button"
                className="block w-full text-left px-4 py-2 text-sm font-medium text-white/80 hover:text-white"
                onClick={() => {
                  setMobileMenuOpen(false);
                  openAuthModal("login");
                }}
              >
                ALERTS
              </button>
            )}
            {!user ? (
              <>
                <button
                  type="button"
                  className="block w-full text-left px-4 py-2 text-sm font-medium text-white/80 hover:text-white"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuthModal("login");
                  }}
                >
                  LOGIN
                </button>
                <Link
                  href="/register"
                  className="block px-4 py-2 text-sm font-medium text-white/80 hover:text-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  SIGN UP
                </Link>
              </>
            ) : (
              <button
                type="button"
                className="block w-full text-left px-4 py-2 text-sm font-medium text-white/80 hover:text-white"
                onClick={() => {
                  setMobileMenuOpen(false);
                  signOut();
                }}
              >
                LOGOUT
              </button>
            )}

            <div className="px-4 pt-2">
              <div className="text-[11px] text-white/50 font-semibold mb-2">REGION</div>
              <div className="inline-flex items-center gap-1 rounded-full bg-[#121212] border border-white/10 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setRegion("US");
                    setMobileMenuOpen(false);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-extrabold transition-colors ${
                    region === "US" ? "bg-white/10 text-white" : "text-white/60 hover:text-white"
                  }`}
                >
                  US
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRegion("UK");
                    setMobileMenuOpen(false);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-extrabold transition-colors ${
                    region === "UK" ? "bg-white/10 text-white" : "text-white/60 hover:text-white"
                  }`}
                >
                  UK
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
