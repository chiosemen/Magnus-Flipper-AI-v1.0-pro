"use client";

import "./globals.css";
import "../theme/theme.css";
import "../marketing-swoopa/marketing.css";
import "./lovable.css";
import React from "react";
import { Toaster } from "../marketing-swoopa/components/ui/toaster";
import { Toaster as Sonner } from "../marketing-swoopa/components/ui/sonner";
import { TooltipProvider } from "../marketing-swoopa/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { AppProviders } from "@/providers/AppProviders";

const queryClient = new QueryClient();

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
        <AppProviders>
          <ThemeProvider defaultTheme="dark">
            <QueryClientProvider client={queryClient}>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                {children as React.ReactNode}
              </TooltipProvider>
            </QueryClientProvider>
          </ThemeProvider>
        </AppProviders>
      </body>
    </html>
  );
}
