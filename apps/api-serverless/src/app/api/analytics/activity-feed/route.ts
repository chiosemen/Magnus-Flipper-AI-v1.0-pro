/**
 * Activity Feed API
 * GET /api/analytics/activity-feed
 *
 * Real-time activity feed for dashboard updates
 * This endpoint works with Supabase Realtime for live updates
 *
 * Query params:
 * - marketplace: Filter by marketplace (optional)
 * - activityType: Filter by activity type (optional)
 * - userId: Filter by user (optional)
 * - limit: Number of activities to return (default: 50, max: 200)
 * - since: ISO timestamp to fetch activities since (optional)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ActivityFeedQuery {
  marketplace?: string;
  activityType?: string;
  userId?: string;
  limit?: number;
  since?: string;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query: ActivityFeedQuery = {
      marketplace: searchParams.get('marketplace') || undefined,
      activityType: searchParams.get('activityType') || undefined,
      userId: searchParams.get('userId') || undefined,
      limit: Math.min(parseInt(searchParams.get('limit') || '50'), 200),
      since: searchParams.get('since') || undefined,
    };

    // Build the query
    let dbQuery = supabase
      .from('activity_feed')
      .select(`
        *,
        marketplace_listings(id, title, price, url, image_url),
        saved_searches(id, category, manufacturer, models)
      `)
      .order('created_at', { ascending: false })
      .limit(query.limit!);

    if (query.marketplace) {
      dbQuery = dbQuery.eq('marketplace', query.marketplace);
    }

    if (query.activityType) {
      dbQuery = dbQuery.eq('activity_type', query.activityType);
    }

    if (query.userId) {
      dbQuery = dbQuery.eq('user_id', query.userId);
    }

    if (query.since) {
      dbQuery = dbQuery.gt('created_at', query.since);
    }

    const { data: activities, error } = await dbQuery;

    if (error) {
      console.error('[Activity Feed API] Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch activity feed', details: error.message },
        { status: 500 }
      );
    }

    // Format activities for display
    const formattedActivities = activities?.map((activity: any) => ({
      id: activity.id,
      type: activity.activity_type,
      marketplace: activity.marketplace,
      title: activity.title,
      description: activity.description,
      listing: activity.marketplace_listings ? {
        id: activity.marketplace_listings.id,
        title: activity.marketplace_listings.title,
        price: activity.marketplace_listings.price,
        url: activity.marketplace_listings.url,
        imageUrl: activity.marketplace_listings.image_url,
      } : null,
      savedSearch: activity.saved_searches,
      metadata: activity.metadata,
      timestamp: activity.created_at,
    }));

    // Calculate summary stats
    const summary = {
      totalActivities: formattedActivities?.length || 0,
      newListings: formattedActivities?.filter((a: any) => a.type === 'NEW_LISTING').length || 0,
      priceDrops: formattedActivities?.filter((a: any) => a.type === 'PRICE_DROP').length || 0,
      priceIncreases: formattedActivities?.filter((a: any) => a.type === 'PRICE_INCREASE').length || 0,
      searchMatches: formattedActivities?.filter((a: any) => a.type === 'SEARCH_MATCH').length || 0,
      alertsTriggered: formattedActivities?.filter((a: any) => a.type === 'ALERT_TRIGGERED').length || 0,
      crawlerErrors: formattedActivities?.filter((a: any) => a.type === 'CRAWLER_ERROR').length || 0,
    };

    return NextResponse.json({
      success: true,
      query,
      summary,
      activities: formattedActivities,
      realtimeEnabled: true,
      realtimeChannel: 'activity_feed',
    });
  } catch (error) {
    console.error('[Activity Feed API] Unexpected error:', error);
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
 * POST /api/analytics/activity-feed
 * Create a new activity feed entry
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      activityType,
      marketplace,
      userId,
      listingId,
      savedSearchId,
      title,
      description,
      metadata,
    } = body;

    if (!activityType || !marketplace || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: activityType, marketplace, title' },
        { status: 400 }
      );
    }

    const validTypes = ['NEW_LISTING', 'PRICE_DROP', 'PRICE_INCREASE', 'SEARCH_MATCH', 'ALERT_TRIGGERED', 'CRAWLER_ERROR'];
    if (!validTypes.includes(activityType)) {
      return NextResponse.json(
        { error: `Invalid activityType. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('activity_feed')
      .insert({
        activity_type: activityType,
        marketplace,
        user_id: userId || null,
        listing_id: listingId || null,
        saved_search_id: savedSearchId || null,
        title,
        description: description || null,
        metadata: metadata || null,
      })
      .select()
      .single();

    if (error) {
      console.error('[Activity Feed API] Insert error:', error);
      return NextResponse.json(
        { error: 'Failed to create activity', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Activity created and will be broadcast to subscribers via Supabase Realtime',
    });
  } catch (error) {
    console.error('[Activity Feed API] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
