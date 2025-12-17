"use client";

import { footerNav, legalNav } from "@/config/navigation";
import { TrackedLink } from "./TrackedLink";

/**
 * Footer Component
 * 
 * Global footer for marketing pages. Includes links to all marketing pages
 * to prevent orphan routes and improve SEO crawl depth.
 */
export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Magnus Flipper</h3>
            <p className="text-sm text-muted-foreground">
              AI-powered resale & arbitrage intelligence
            </p>
          </div>

          {/* Navigation */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Navigation</h4>
            <nav className="flex flex-col space-y-2">
              {footerNav.map((item) => (
                <TrackedLink
                  key={item.href}
                  href={item.href}
                  intent="footer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.label}
                </TrackedLink>
              ))}
            </nav>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Legal</h4>
            <nav className="flex flex-col space-y-2">
              {legalNav.map((item) => (
                <TrackedLink
                  key={item.href}
                  href={item.href}
                  intent="footer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.label}
                </TrackedLink>
              ))}
            </nav>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Contact</h4>
            <p className="text-sm text-muted-foreground">
              Questions? Reach out to{" "}
              <a
                href="mailto:support@flipperagents.com"
                className="hover:text-foreground transition-colors"
              >
                support@flipperagents.com
              </a>
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-border/50 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Magnus Flipper. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

