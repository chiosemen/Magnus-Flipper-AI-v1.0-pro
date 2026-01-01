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
        url: '/logo-social-square.svg',
        width: 400,
        height: 400,
        alt: 'Magnus Flipper AI - Find Profitable Flips Before Anyone Else',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'Magnus Flipper AI | Instant Marketplace Alerts',
    description: 'Find profitable flips instantly with AI-powered marketplace scanning',
    creator: '@magnusflipperai',
    images: ['/logo-social-square.svg'],
  },
  icons: {
    icon: '/logo-icon.svg',
    apple: '/logo-icon.svg',
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
      <head>
        <link rel="icon" href="/logo-icon.svg" type="image/svg+xml" />
      </head>
      <body className={`${spaceGrotesk.variable} ${inter.variable}`}>
        {children}
      </body>
    </html>
  );
}
