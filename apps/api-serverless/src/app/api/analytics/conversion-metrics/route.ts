/**
 * Conversion Metrics API
 * GET /api/analytics/conversion-metrics
 *
 * Track user actions and conversion funnel across marketplaces
 *
 * Query params:
 * - marketplace: Filter by marketplace (optional)
 * - savedSearchId: Filter by specific saved search (optional)
 * - userId: Filter by user (optional, admin only)
 * - days: Number of days to look back (default: 30)
 * - groupBy: Group results by 'marketplace' or 'search' (default: 'marketplace')
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ConversionQuery {
  marketplace?: string;
  savedSearchId?: string;
  userId?: string;
  days?: number;
  groupBy?: 'marketplace' | 'search';
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query: ConversionQuery = {
      marketplace: searchParams.get('marketplace') || undefined,
      savedSearchId: searchParams.get('savedSearchId') || undefined,
      userId: searchParams.get('userId') || undefined,
      days: parseInt(searchParams.get('days') || '30'),
      groupBy: (searchParams.get('groupBy') as any) || 'marketplace',
    };

    // Build the query
    let dbQuery = supabase
      .from('conversion_metrics')
      .select(`
        *,
        saved_searches(id, category, manufacturer, models),
        marketplace_listings(title, price, url)
      `)
      .gte('created_at', new Date(Date.now() - (query.days! * 24 * 60 * 60 * 1000)).toISOString());

    if (query.marketplace) {
      dbQuery = dbQuery.eq('marketplace', query.marketplace);
    }

    if (query.savedSearchId) {
      dbQuery = dbQuery.eq('saved_search_id', query.savedSearchId);
    }

    if (query.userId) {
      dbQuery = dbQuery.eq('user_id', query.userId);
    }

    const { data: metrics, error } = await dbQuery;

    if (error) {
      console.error('[Conversion Metrics API] Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch conversion metrics', details: error.message },
        { status: 500 }
      );
    }

    // Group metrics
    const groupMap = new Map<string, any>();

    metrics?.forEach((metric: any) => {
      const groupKey = query.groupBy === 'marketplace'
        ? metric.marketplace
        : metric.saved_search_id || 'unknown';

      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, {
          group: groupKey,
          marketplace: metric.marketplace,
          savedSearch: metric.saved_searches,
          views: 0,
          clicks: 0,
          favorites: 0,
          contacts: 0,
          purchases: 0,
          totalActions: 0,
          uniqueListings: new Set(),
          uniqueUsers: new Set(),
        });
      }

      const group = groupMap.get(groupKey);

      // Count actions
      switch (metric.action_type) {
        case 'VIEW':
          group.views++;
          break;
        case 'CLICK':
          group.clicks++;
          break;
        case 'FAVORITE':
          group.favorites++;
          break;
        case 'CONTACT':
          group.contacts++;
          break;
        case 'PURCHASE':
          group.purchases++;
          break;
      }

      group.totalActions++;
      if (metric.listing_id) group.uniqueListings.add(metric.listing_id);
      if (metric.user_id) group.uniqueUsers.add(metric.user_id);
    });

    // Calculate conversion rates
    const analysis = Array.from(groupMap.values()).map((group) => {
      const clickThroughRate = group.views > 0 ? (group.clicks / group.views) * 100 : 0;
      const favoriteRate = group.clicks > 0 ? (group.favorites / group.clicks) * 100 : 0;
      const contactRate = group.clicks > 0 ? (group.contacts / group.clicks) * 100 : 0;
      const conversionRate = group.clicks > 0 ? (group.purchases / group.clicks) * 100 : 0;
      const overallConversionRate = group.views > 0 ? (group.purchases / group.views) * 100 : 0;

      return {
        group: group.group,
        marketplace: group.marketplace,
        savedSearch: group.savedSearch,
        metrics: {
          views: group.views,
          clicks: group.clicks,
          favorites: group.favorites,
          contacts: group.contacts,
          purchases: group.purchases,
          totalActions: group.totalActions,
        },
        uniqueListings: group.uniqueListings.size,
        uniqueUsers: group.uniqueUsers.size,
        conversionFunnel: {
          clickThroughRate: Math.round(clickThroughRate * 100) / 100,
          favoriteRate: Math.round(favoriteRate * 100) / 100,
          contactRate: Math.round(contactRate * 100) / 100,
          conversionRate: Math.round(conversionRate * 100) / 100,
          overallConversionRate: Math.round(overallConversionRate * 100) / 100,
        },
        engagement: {
          avgActionsPerListing: group.uniqueListings.size > 0
            ? Math.round((group.totalActions / group.uniqueListings.size) * 100) / 100
            : 0,
          avgActionsPerUser: group.uniqueUsers.size > 0
            ? Math.round((group.totalActions / group.uniqueUsers.size) * 100) / 100
            : 0,
        },
      };
    });

    // Sort by conversion rate
    analysis.sort((a, b) => b.conversionFunnel.overallConversionRate - a.conversionFunnel.overallConversionRate);

    // Calculate overall summary
    const totalMetrics = metrics || [];
    const summary = {
      totalActions: totalMetrics.length,
      totalViews: totalMetrics.filter((m: any) => m.action_type === 'VIEW').length,
      totalClicks: totalMetrics.filter((m: any) => m.action_type === 'CLICK').length,
      totalFavorites: totalMetrics.filter((m: any) => m.action_type === 'FAVORITE').length,
      totalContacts: totalMetrics.filter((m: any) => m.action_type === 'CONTACT').length,
      totalPurchases: totalMetrics.filter((m: any) => m.action_type === 'PURCHASE').length,
      bestPerformingMarketplace: analysis[0] || null,
      worstPerformingMarketplace: analysis[analysis.length - 1] || null,
    };

    return NextResponse.json({
      success: true,
      query,
      summary,
      analysis,
      totalGroups: analysis.length,
    });
  } catch (error) {
    console.error('[Conversion Metrics API] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/analytics/conversion-metrics
 * Track a new user action
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { userId, listingId, savedSearchId, marketplace, actionType, metadata } = body;

    if (!userId || !marketplace || !actionType) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, marketplace, actionType' },
        { status: 400 }
      );
    }

    const validActions = ['VIEW', 'CLICK', 'FAVORITE', 'CONTACT', 'PURCHASE'];
    if (!validActions.includes(actionType)) {
      return NextResponse.json(
        { error: `Invalid actionType. Must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('conversion_metrics')
      .insert({
        user_id: userId,
        listing_id: listingId || null,
        saved_search_id: savedSearchId || null,
        marketplace,
        action_type: actionType,
        action_metadata: metadata || null,
      })
      .select()
      .single();

    if (error) {
      console.error('[Conversion Metrics API] Insert error:', error);
      return NextResponse.json(
        { error: 'Failed to track action', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('[Conversion Metrics API] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
