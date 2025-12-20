"use client";

import "./globals.css";
import "../theme/theme.css";
import "../marketing-swoopa/marketing.css";
import React from "react";
import { Toaster } from "../marketing-swoopa/components/ui/toaster";
import { Toaster as Sonner } from "../marketing-swoopa/components/ui/sonner";
import { TooltipProvider } from "../marketing-swoopa/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@magnus-flipper-ai/ui/providers";
import { AuthProvider } from "@/providers/AuthProvider";
import { HelpWidget } from "@/components/HelpWidget";
import { RegionProvider } from "@/providers/RegionProvider";
import { HydrationProvider } from "@/providers/HydrationProvider";
import dynamic from "next/dynamic";

const queryClient = new QueryClient();

const MotionDebugOverlay =
  process.env.NODE_ENV === "development"
    ? dynamic(
        () =>
          import("@/components/dev/MotionDebugOverlay").then(
            (m) => m.MotionDebugOverlay
          ),
        { ssr: false }
      )
    : () => null;

export default function RootLayout({ children }: any) {
  return (
    <html lang="en" suppressHydrationWarning data-theme="dark">
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
        className="font-body antialiased"
        style={{ 
          position: "relative", 
          overflowX: "hidden"
        }}
      >
        <ThemeProvider defaultTheme="dark">
          <HydrationProvider>
            <AuthProvider>
              <RegionProvider>
                <QueryClientProvider client={queryClient}>
                  <TooltipProvider>
                    <Toaster />
                    <Sonner />
                    {children as React.ReactNode}
                    <HelpWidget />
                    <MotionDebugOverlay />
                  </TooltipProvider>
                </QueryClientProvider>
              </RegionProvider>
            </AuthProvider>
          </HydrationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
