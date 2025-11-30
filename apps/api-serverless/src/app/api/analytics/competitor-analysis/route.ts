/**
 * Competitor Analysis API
 * GET /api/analytics/competitor-analysis
 *
 * Compare pricing and availability across different marketplaces for similar items
 *
 * Query params:
 * - query: Search query to compare across marketplaces
 * - category: Category filter (optional)
 * - minPrice: Minimum price filter (optional)
 * - maxPrice: Maximum price filter (optional)
 * - days: Number of days to look back (default: 7)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface CompetitorQuery {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  days?: number;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query: CompetitorQuery = {
      query: searchParams.get('query') || undefined,
      category: searchParams.get('category') || undefined,
      minPrice: parseFloat(searchParams.get('minPrice') || '0') || undefined,
      maxPrice: parseFloat(searchParams.get('maxPrice') || '0') || undefined,
      days: parseInt(searchParams.get('days') || '7'),
    };

    if (!query.query && !query.category) {
      return NextResponse.json(
        { error: 'Either query or category parameter is required' },
        { status: 400 }
      );
    }

    // Build the query
    let dbQuery = supabase
      .from('marketplace_listings')
      .select('*')
      .gte('created_at', new Date(Date.now() - (query.days! * 24 * 60 * 60 * 1000)).toISOString());

    // Apply filters
    if (query.query) {
      dbQuery = dbQuery.ilike('title', `%${query.query}%`);
    }

    if (query.minPrice) {
      dbQuery = dbQuery.gte('price', query.minPrice);
    }

    if (query.maxPrice) {
      dbQuery = dbQuery.lte('price', query.maxPrice);
    }

    const { data: listings, error } = await dbQuery;

    if (error) {
      console.error('[Competitor Analysis API] Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch listings', details: error.message },
        { status: 500 }
      );
    }

    // Group by marketplace
    const marketplaceStats = new Map<string, any>();

    const MARKETPLACES = ['VINTED', 'EBAY', 'GUMTREE', 'CRAIGSLIST', 'OFFERUP', 'FB_MARKETPLACE'];

    MARKETPLACES.forEach(mp => {
      marketplaceStats.set(mp, {
        marketplace: mp,
        totalListings: 0,
        averagePrice: 0,
        medianPrice: 0,
        lowestPrice: Infinity,
        highestPrice: -Infinity,
        priceRange: 0,
        listings: [],
        priceDistribution: {
          under50: 0,
          '50to100': 0,
          '100to200': 0,
          '200to500': 0,
          over500: 0,
        },
      });
    });

    // Populate marketplace stats
    listings?.forEach((listing: any) => {
      const marketplace = listing.marketplace;
      if (!marketplaceStats.has(marketplace)) return;

      const stats = marketplaceStats.get(marketplace);
      const price = parseFloat(listing.price || 0);

      stats.totalListings++;
      stats.listings.push({
        id: listing.id,
        externalId: listing.external_id,
        title: listing.title,
        price,
        url: listing.url,
        imageUrl: listing.image_url,
        location: listing.location,
        condition: listing.condition,
        postedAt: listing.posted_at,
      });

      stats.lowestPrice = Math.min(stats.lowestPrice, price);
      stats.highestPrice = Math.max(stats.highestPrice, price);

      // Update price distribution
      if (price < 50) stats.priceDistribution.under50++;
      else if (price < 100) stats.priceDistribution['50to100']++;
      else if (price < 200) stats.priceDistribution['100to200']++;
      else if (price < 500) stats.priceDistribution['200to500']++;
      else stats.priceDistribution.over500++;
    });

    // Calculate averages and medians
    const comparison = Array.from(marketplaceStats.values())
      .map((stats) => {
        if (stats.totalListings === 0) {
          stats.lowestPrice = 0;
          stats.highestPrice = 0;
          return stats;
        }

        // Calculate average
        const sum = stats.listings.reduce((acc: number, l: any) => acc + l.price, 0);
        stats.averagePrice = sum / stats.totalListings;

        // Calculate median
        const sortedPrices = stats.listings.map((l: any) => l.price).sort((a: number, b: number) => a - b);
        const mid = Math.floor(sortedPrices.length / 2);
        stats.medianPrice = sortedPrices.length % 2 === 0
          ? (sortedPrices[mid - 1] + sortedPrices[mid]) / 2
          : sortedPrices[mid];

        stats.priceRange = stats.highestPrice - stats.lowestPrice;

        // Keep only top 5 cheapest listings for each marketplace
        stats.listings.sort((a: any, b: any) => a.price - b.price);
        stats.topDeals = stats.listings.slice(0, 5);

        // Remove full listings array from response to reduce payload size
        delete stats.listings;

        return stats;
      })
      .filter(stats => stats.totalListings > 0) // Only include marketplaces with results
      .sort((a, b) => a.averagePrice - b.averagePrice); // Sort by average price

    // Calculate overall summary
    const allListings = listings || [];
    const totalListings = allListings.length;

    const summary = {
      totalListings,
      marketplacesWithResults: comparison.length,
      cheapestMarketplace: comparison[0] || null,
      mostExpensiveMarketplace: comparison[comparison.length - 1] || null,
      bestDeals: allListings
        .map((l: any) => ({
          marketplace: l.marketplace,
          title: l.title,
          price: parseFloat(l.price || 0),
          url: l.url,
          imageUrl: l.image_url,
          location: l.location,
        }))
        .sort((a, b) => a.price - b.price)
        .slice(0, 10), // Top 10 best deals across all marketplaces
    };

    return NextResponse.json({
      success: true,
      query,
      summary,
      comparison,
    });
  } catch (error) {
    console.error('[Competitor Analysis API] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
