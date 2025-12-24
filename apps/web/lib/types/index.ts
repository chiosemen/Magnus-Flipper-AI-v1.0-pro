/**
 * 🔒 WEB CONTRACT SURFACE
 * 
 * This is the ONLY type import surface for apps/web.
 * All components must import types from here or subpaths.
 * 
 * Contract Philosophy:
 * - Web depends on stable contracts, not implementation
 * - Breaking changes are explicit and intentional
 * - Types are manually synced from backend (no auto-sync)
 * - This prevents silent drift and cascade failures
 * 
 * Usage:
 *   ✅ import type { FeedItem } from "@/lib/types"
 *   ✅ import type { FeedItem } from "@/lib/types/feed"
 *   ❌ import type { FeedItem } from "@magnus-flipper-ai/core/types/feed"
 */

// Feed contracts
export * from "./feed";

// Scraper contracts
export * from "./scraper";

// Compliance contracts
export * from "./compliance";

// Contract metadata
export * from "./_contract";

