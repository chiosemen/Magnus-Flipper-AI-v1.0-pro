export const dynamic = "force-dynamic";

export const fetchCache = "force-no-store";

export const revalidate = 0;

import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Magnus Flipper - Real-Time Arbitrage Engine",
  description: "Find underpriced deals across every marketplace — analysed by Magnus AI with real profit projections.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-black text-slate-50">
        <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>Loading...</div>}>
          {children}
        </Suspense>
      </body>
    </html>
  );
}

