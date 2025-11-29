/**
 * Listings Feed API Route
 * GET /api/listings/feed - Get matched listings for a saved search
 */
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/listings/feed?savedSearchId=xxx&page=1&pageSize=20
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async ({ user }) => {
    const { searchParams } = new URL(request.url);
    const savedSearchId = searchParams.get('savedSearchId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = Math.min(100, parseInt(searchParams.get('pageSize') || '20', 10));

    if (!savedSearchId) {
      return NextResponse.json({ error: 'savedSearchId is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Verify the saved search belongs to the user
    const { data: savedSearch, error: searchError } = await supabase
      .from('saved_searches')
      .select('id')
      .eq('id', savedSearchId)
      .eq('user_id', user.id)
      .single();

    if (searchError || !savedSearch) {
      return NextResponse.json({ error: 'Saved search not found' }, { status: 404 });
    }

    const offset = (page - 1) * pageSize;

    // Fetch matched listings with join
    const { data: matches, error: matchesError } = await supabase
      .from('listing_matches')
      .select(`
        id,
        matched_at,
        notified,
        notified_at,
        listing:listings (
          id,
          external_id,
          site,
          url,
          title,
          description,
          price,
          currency,
          manufacturer,
          model,
          condition,
          city,
          region,
          country,
          latitude,
          longitude,
          posted_at,
          scraped_at,
          image_urls
        )
      `)
      .eq('saved_search_id', savedSearchId)
      .order('matched_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (matchesError) {
      return NextResponse.json({ error: matchesError.message }, { status: 500 });
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('listing_matches')
      .select('id', { count: 'exact', head: true })
      .eq('saved_search_id', savedSearchId);

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    // Transform the data to flatten listing object
    const results = (matches || []).map((match: any) => ({
      ...match.listing,
      matchedAt: match.matched_at,
      notified: match.notified,
      notifiedAt: match.notified_at,
    }));

    return NextResponse.json({
      results,
      total: count || 0,
      page,
      pageSize,
      hasMore: (count || 0) > offset + pageSize,
    });
  });
}
