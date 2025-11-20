import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Magnus Flipper AI — Smart Market Scouting',
  description: 'AI-powered deal scouting and flipping intelligence from Magnus-Tech.AI'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="https://flipperagents.com/favicon.ico" />
        <meta property="og:title" content="Magnus Flipper AI" />
        <meta property="og:description" content="Scan, Flip, and Profit Smarter — Powered by Magnus-Tech.AI" />
        <meta property="og:image" content="https://flipperagents.com/og-image.png" />
        <meta name="theme-color" content="#00C4FF" />
      </head>
      <body>{children}</body>
    </html>
  );
}
