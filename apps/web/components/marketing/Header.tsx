"use client";

import Link from "next/link";
import { useState } from "react";
import { marketingNav } from "@/config/navigation";
import { TrackedLink } from "./TrackedLink";
import { Button } from "@/components/flipbomb/ui/button";
import { Menu, X } from "lucide-react";

/**
 * Header Component
 * 
 * Global header for marketing pages. Includes logo, navigation links,
 * and login/upgrade CTAs. Mobile-responsive with hamburger menu.
 */
export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold">Magnus Flipper</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {marketingNav.map((item) => (
              <TrackedLink
                key={item.href}
                href={item.href}
                intent="header"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </TrackedLink>
            ))}
          </nav>

          {/* CTAs */}
          <div className="hidden md:flex items-center space-x-4">
            <TrackedLink href="/login" intent="secondary">
              <Button variant="ghost" size="sm">
                Login
              </Button>
            </TrackedLink>
            <TrackedLink href="/upgrade" intent="primary">
              <Button size="sm">Upgrade</Button>
            </TrackedLink>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => {
              console.log("menu toggle");
              setMobileMenuOpen(!mobileMenuOpen);
            }}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/50 py-4 space-y-4">
            <nav className="flex flex-col space-y-2">
              {marketingNav.map((item) => (
                <TrackedLink
                  key={item.href}
                  href={item.href}
                  intent="header"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </TrackedLink>
              ))}
            </nav>
            <div className="flex flex-col space-y-2 pt-4 border-t border-border/50">
              <TrackedLink href="/login" intent="secondary">
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  Login
                </Button>
              </TrackedLink>
              <TrackedLink href="/upgrade" intent="primary">
                <Button size="sm" className="w-full">
                  Upgrade
                </Button>
              </TrackedLink>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

