import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { createServerClient } from "@/lib/supabase/server";
import type { FingerprintStats } from "@magnus-flipper-ai/core/types/scraper";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/scraper/fingerprints
 * Get fingerprint statistics for deduplication analysis
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const marketplace = searchParams.get("marketplace");
    const timeWindow = searchParams.get("timeWindow") || "24h";

    const supabase = await createServerClient();

    // Calculate time window
    const now = new Date();
    let startTime: Date;
    switch (timeWindow) {
      case "1h":
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case "6h":
        startTime = new Date(now.getTime() - 6 * 60 * 60 * 1000);
        break;
      case "24h":
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "7d":
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    // Query listings with content_hash (if available) or calculate from title/price
    let query = supabase
      .from("listings_raw")
      .select("marketplace, title, price, content_hash")
      .gte("last_seen_at", startTime.toISOString())
      .limit(10000); // Limit for performance

    if (marketplace) {
      query = query.eq("marketplace", marketplace);
    }

    const { data: listings, error } = await query;

    if (error) {
      console.error("Error fetching fingerprint data:", error);
      return NextResponse.json({
        fingerprints: [],
      });
    }

    // Calculate fingerprint statistics per marketplace
    const marketplaceGroups = new Map<string, any[]>();
    (listings || []).forEach((listing: any) => {
      const mp = listing.marketplace || "unknown";
      if (!marketplaceGroups.has(mp)) {
        marketplaceGroups.set(mp, []);
      }
      marketplaceGroups.get(mp)!.push(listing);
    });

    const fingerprintStats: FingerprintStats[] = Array.from(marketplaceGroups.entries()).map(
      ([mp, items]) => {
        // Use content_hash if available, otherwise generate simple hash from title+price
        const fingerprints = new Map<string, number>();
        items.forEach((item) => {
          const hash = item.content_hash || `${item.title}-${item.price}`;
          fingerprints.set(hash, (fingerprints.get(hash) || 0) + 1);
        });

        const totalFingerprints = items.length;
        const uniqueFingerprints = fingerprints.size;
        const duplicateRate = totalFingerprints > 0
          ? (totalFingerprints - uniqueFingerprints) / totalFingerprints
          : 0;

        // Distribution by hash prefix (first 8 chars)
        const distributionMap = new Map<string, number>();
        fingerprints.forEach((count, hash) => {
          const prefix = hash.substring(0, 8);
          distributionMap.set(prefix, (distributionMap.get(prefix) || 0) + count);
        });

        const fingerprintDistribution = Array.from(distributionMap.entries())
          .map(([hashPrefix, count]) => ({ hashPrefix, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 20); // Top 20 prefixes

        return {
          marketplace: mp,
          totalFingerprints,
          uniqueFingerprints,
          duplicateRate,
          fingerprintDistribution,
        };
      }
    );

    return NextResponse.json(
      {
        fingerprints: marketplace ? fingerprintStats[0] : fingerprintStats,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Error in /api/scraper/fingerprints:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
