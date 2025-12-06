import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Magnus Flipper - Real-Time Arbitrage Engine",
  description: "Find underpriced deals across every marketplace — analysed by Magnus AI with real profit projections.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

