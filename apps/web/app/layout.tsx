"use client";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import "../marketing-swoopa/marketing.css";
import { ReactNode } from "react";
import { Toaster } from "../marketing-swoopa/components/ui/toaster";
import { Toaster as Sonner } from "../marketing-swoopa/components/ui/sonner";
import { TooltipProvider } from "../marketing-swoopa/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>Magnus Flipper – AI Marketplace Intelligence</title>
        <meta name="description" content="Real-time cross-marketplace scanning, pricing intelligence, and deal alerts powered by AI." />
        <meta property="og:title" content="Magnus Flipper – AI Marketplace Intelligence" />
        <meta property="og:description" content="Real-time cross-marketplace scanning, pricing intelligence, and deal alerts powered by AI." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Magnus Flipper – AI Marketplace Intelligence" />
        <meta name="twitter:description" content="Real-time cross-marketplace scanning, pricing intelligence, and deal alerts powered by AI." />
      </head>
      <body
        style={{
          position: "relative",
          overflowX: "hidden",
          backgroundColor: "#0A0A0A"
        }}
      >
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            {children}
          </TooltipProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
