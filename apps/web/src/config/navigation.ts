/**
 * Navigation Configuration
 * 
 * Single source of truth for all navigation links across Magnus Flipper.
 * Prevents broken links during refactors and ensures SEO-friendly internal linking.
 */

export interface NavItem {
  label: string;
  href: string;
  description?: string;
  external?: boolean;
}

export const marketingNav: NavItem[] = [
  {
    label: "Deal Scanner",
    href: "/flipbomb",
    description: "Scan market demand across marketplaces",
  },
  {
    label: "Sell Your Car",
    href: "/sell-used-car",
    description: "Get dealer offers for your vehicle",
  },
];

export const appNav: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    description: "View your scans and results",
  },
  {
    label: "Upgrade",
    href: "/upgrade",
    description: "Unlock premium features",
  },
];

export const footerNav: NavItem[] = [
  {
    label: "Home",
    href: "/",
  },
  ...marketingNav,
  {
    label: "Login",
    href: "/login",
  },
];

export const legalNav: NavItem[] = [
  {
    label: "Privacy Policy",
    href: "/privacy",
  },
  {
    label: "Terms of Service",
    href: "/terms",
  },
];

