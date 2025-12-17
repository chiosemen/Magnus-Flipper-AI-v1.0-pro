"use client";

import Link from "next/link";
import { Button } from "../../components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export const MMAgentHeader = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: "Objectives", href: "#objectives" },
    { label: "Features", href: "#features" },
    { label: "User Flow", href: "#user-flow" },
    { label: "Contact Us", href: "#contact" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-mm-border">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/tech-trade" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-mm-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="font-heading font-bold text-xl text-mm-dark">
              MM AGENT
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-mm-text hover:text-mm-primary transition-colors font-medium"
                onClick={(e) => {
                  if (link.href.startsWith('#')) {
                    e.preventDefault();
                    document.getElementById(link.href.slice(1))?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* CTA Button */}
          <Button className="hidden md:flex bg-mm-primary hover:bg-mm-primary-dark text-white rounded-full px-6" asChild>
            <Link href="/register">Apply for Access</Link>
          </Button>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-mm-dark"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-mm-border pt-4">
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-mm-text hover:text-mm-primary transition-colors font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <Button className="bg-mm-primary hover:bg-mm-primary-dark text-white rounded-full w-full mt-2" asChild>
                <Link href="/register">Apply for Access</Link>
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
