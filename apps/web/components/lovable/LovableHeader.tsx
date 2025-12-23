"use client";

import { Button } from "../flipbomb/ui/button";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { slideDown, fadeIn, tapScale } from "@/lib/motion";

const LovableHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const navLinks = [
    { label: "Features", href: "/#features" },
    { label: "How It Works", href: "/#how-it-works" },
    { label: "Marketplaces", href: "/#marketplaces" },
    { label: "Pricing", href: "/pricing" },
  ];

  // Close menu on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isMenuOpen]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMenuOpen]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
            <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center shadow-glow">
              <span className="text-accent-foreground font-bold text-xl">M</span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg text-foreground leading-tight">Magnus</span>
              <span className="text-xs text-muted-foreground leading-tight">Flipper AI</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm font-medium"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="default" size="default">
                Start Free Trial
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 text-foreground"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <>
              {/* Overlay */}
              <motion.div
                variants={fadeIn}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                onClick={() => setIsMenuOpen(false)}
                aria-hidden="true"
              />
              {/* Menu */}
              <motion.div
                variants={slideDown}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="fixed left-0 right-0 top-16 bg-background border-t border-border/50 z-50 lg:hidden max-h-[calc(100vh-4rem)] overflow-y-auto"
              >
                <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
                  {navLinks.map((link, index) => (
                    <motion.a
                      key={link.label}
                      initial={shouldReduceMotion ? {} : { opacity: 0, x: -20 }}
                      animate={shouldReduceMotion ? {} : { opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      href={link.href}
                      className="px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors duration-200 text-sm font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {link.label}
                    </motion.a>
                  ))}
                  <motion.div
                    initial={shouldReduceMotion ? {} : { opacity: 0, y: 10 }}
                    animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
                    transition={{ delay: navLinks.length * 0.05 }}
                    className="flex flex-col gap-2 mt-4 px-4"
                  >
                    <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                      <motion.div whileTap={shouldReduceMotion ? {} : tapScale} className="w-full">
                        <Button variant="outline" className="w-full">
                          Sign In
                        </Button>
                      </motion.div>
                    </Link>
                    <Link href="/register" onClick={() => setIsMenuOpen(false)}>
                      <motion.div whileTap={shouldReduceMotion ? {} : tapScale} className="w-full">
                        <Button variant="default" className="w-full">
                          Start Free Trial
                        </Button>
                      </motion.div>
                    </Link>
                  </motion.div>
                </nav>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};

export default LovableHeader;

