/**
 * Price Trend Analysis API
 * GET /api/analytics/price-trends
 *
 * Query params:
 * - marketplace: Filter by marketplace (optional)
 * - externalId: Filter by specific listing ID (optional)
 * - days: Number of days to look back (default: 30)
 * - minPriceChange: Minimum price change percentage to filter (optional)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface PriceTrendQuery {
  marketplace?: string;
  externalId?: string;
  days?: number;
  minPriceChange?: number;
  sortBy?: 'biggest_drop' | 'biggest_increase' | 'most_volatile' | 'recent';
  limit?: number;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query: PriceTrendQuery = {
      marketplace: searchParams.get('marketplace') || undefined,
      externalId: searchParams.get('externalId') || undefined,
      days: parseInt(searchParams.get('days') || '30'),
      minPriceChange: parseFloat(searchParams.get('minPriceChange') || '0'),
      sortBy: (searchParams.get('sortBy') as any) || 'recent',
      limit: parseInt(searchParams.get('limit') || '50'),
    };

    // Build the query
    let dbQuery = supabase
      .from('price_history')
      .select(`
        *,
        marketplace_listings!inner(
          id,
          marketplace,
          external_id,
          title,
          url,
          image_url,
          location
        )
      `)
      .gte('recorded_at', new Date(Date.now() - (query.days! * 24 * 60 * 60 * 1000)).toISOString())
      .order('recorded_at', { ascending: false });

    if (query.marketplace) {
      dbQuery = dbQuery.eq('marketplace', query.marketplace);
    }

    if (query.externalId) {
      dbQuery = dbQuery.eq('external_id', query.externalId);
    }

    const { data: priceHistory, error } = await dbQuery;

    if (error) {
      console.error('[Price Trends API] Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch price trends', details: error.message },
        { status: 500 }
      );
    }

    // Group by listing and calculate trends
    const listingMap = new Map<string, any>();

    priceHistory?.forEach((record: any) => {
      const key = `${record.marketplace}-${record.external_id}`;

      if (!listingMap.has(key)) {
        listingMap.set(key, {
          marketplace: record.marketplace,
          externalId: record.external_id,
          title: record.marketplace_listings.title,
          url: record.marketplace_listings.url,
          imageUrl: record.marketplace_listings.image_url,
          location: record.marketplace_listings.location,
          priceHistory: [],
          currentPrice: 0,
          lowestPrice: Infinity,
          highestPrice: -Infinity,
          totalPriceChange: 0,
          totalPriceChangePercent: 0,
          priceChangesCount: 0,
          averagePrice: 0,
          volatility: 0,
          lastUpdated: record.recorded_at,
        });
      }

      const listing = listingMap.get(key);
      listing.priceHistory.push({
        price: parseFloat(record.price),
        priceChange: record.price_change ? parseFloat(record.price_change) : null,
        priceChangePercent: record.price_change_percent ? parseFloat(record.price_change_percent) : null,
        recordedAt: record.recorded_at,
      });

      // Update stats
      const price = parseFloat(record.price);
      listing.lowestPrice = Math.min(listing.lowestPrice, price);
      listing.highestPrice = Math.max(listing.highestPrice, price);

      if (record.price_change) {
        listing.priceChangesCount++;
      }
    });

    // Calculate aggregated metrics for each listing
    const trends = Array.from(listingMap.values()).map((listing) => {
      // Sort price history by date
      listing.priceHistory.sort((a: any, b: any) =>
        new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
      );

      // Get current and initial price
      const currentPrice = listing.priceHistory[listing.priceHistory.length - 1]?.price || 0;
      const initialPrice = listing.priceHistory[0]?.price || 0;

      listing.currentPrice = currentPrice;
      listing.totalPriceChange = currentPrice - initialPrice;
      listing.totalPriceChangePercent = initialPrice > 0
        ? ((currentPrice - initialPrice) / initialPrice) * 100
        : 0;

      // Calculate average price
      const sum = listing.priceHistory.reduce((acc: number, ph: any) => acc + ph.price, 0);
      listing.averagePrice = sum / listing.priceHistory.length;

      // Calculate volatility (standard deviation)
      const variance = listing.priceHistory.reduce((acc: number, ph: any) => {
        return acc + Math.pow(ph.price - listing.averagePrice, 2);
      }, 0) / listing.priceHistory.length;
      listing.volatility = Math.sqrt(variance);

      return listing;
    });

    // Filter by minimum price change if specified
    let filteredTrends = trends;
    if (query.minPriceChange && query.minPriceChange > 0) {
      filteredTrends = trends.filter((t) =>
        Math.abs(t.totalPriceChangePercent) >= query.minPriceChange!
      );
    }

    // Sort based on sortBy parameter
    switch (query.sortBy) {
      case 'biggest_drop':
        filteredTrends.sort((a, b) => a.totalPriceChangePercent - b.totalPriceChangePercent);
        break;
      case 'biggest_increase':
        filteredTrends.sort((a, b) => b.totalPriceChangePercent - a.totalPriceChangePercent);
        break;
      case 'most_volatile':
        filteredTrends.sort((a, b) => b.volatility - a.volatility);
        break;
      case 'recent':
      default:
        filteredTrends.sort((a, b) =>
          new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
        );
    }

    // Apply limit
    const limitedTrends = filteredTrends.slice(0, query.limit);

    // Calculate summary stats
    const summary = {
      totalListingsTracked: trends.length,
      totalListingsWithChanges: trends.filter(t => t.priceChangesCount > 0).length,
      averagePriceChange: trends.reduce((acc, t) => acc + t.totalPriceChangePercent, 0) / trends.length || 0,
      biggestDrop: trends.reduce((min, t) =>
        t.totalPriceChangePercent < min.totalPriceChangePercent ? t : min,
        trends[0] || { totalPriceChangePercent: 0 }
      ),
      biggestIncrease: trends.reduce((max, t) =>
        t.totalPriceChangePercent > max.totalPriceChangePercent ? t : max,
        trends[0] || { totalPriceChangePercent: 0 }
      ),
      mostVolatile: trends.reduce((max, t) =>
        t.volatility > max.volatility ? t : max,
        trends[0] || { volatility: 0 }
      ),
    };

    return NextResponse.json({
      success: true,
      summary,
      trends: limitedTrends,
      query,
      totalResults: filteredTrends.length,
    });
  } catch (error) {
    console.error('[Price Trends API] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
