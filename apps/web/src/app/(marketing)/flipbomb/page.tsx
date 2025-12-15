import { Metadata } from "next";
import { FlipbombPageClient } from "./FlipbombPageClient";

export const metadata: Metadata = {
  title: "Run Deal Scan | Magnus Flipper",
  description: "AI-powered resale & arbitrage intelligence. Discover real-time market prices and find profitable deals across marketplaces.",
};

export default function FlipbombPage() {
  return <FlipbombPageClient />;
}

