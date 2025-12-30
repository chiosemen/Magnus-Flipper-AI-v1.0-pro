import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
  preload: true,
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://magnusflipper.ai'),
  title: {
    default: 'Magnus Flipper AI | Instant Marketplace Alerts & Deal Arbitrage',
    template: '%s | Magnus Flipper AI',
  },
  description: 'Find profitable flips instantly. Magnus Flipper AI scans Facebook Marketplace, Craigslist, eBay, and OfferUp 24/7. Get real-time alerts before anyone else sees the deal.',
  keywords: [
    'marketplace alerts',
    'facebook marketplace notifications',
    'deal arbitrage',
    'flipping software',
    'reselling tools',
    'marketplace monitor',
    'deal finder',
    'flip deals',
    'marketplace scanner',
    'craigslist alerts',
    'ebay alerts',
    'offerup alerts',
  ],
  authors: [{ name: 'Magnus Chi', url: 'https://magnus-tech.ai' }],
  creator: 'Magnus-Tech.AI',
  publisher: 'Magnus-Tech.AI',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://magnusflipper.ai',
    siteName: 'Magnus Flipper AI',
    title: 'Magnus Flipper AI | Instant Marketplace Alerts & Deal Arbitrage',
    description: 'Find profitable flips instantly. Magnus Flipper AI scans Facebook Marketplace, Craigslist, eBay, and OfferUp 24/7. Get real-time alerts before anyone else sees the deal.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Magnus Flipper AI - Find Profitable Flips Before Anyone Else',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Magnus Flipper AI | Instant Marketplace Alerts',
    description: 'Find profitable flips instantly with AI-powered marketplace scanning',
    creator: '@magnusflipperai',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
  alternates: {
    canonical: 'https://magnusflipper.ai',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${spaceGrotesk.variable} ${inter.variable}`}>
        {children}
      </body>
    </html>
  );
}
