/**
 * Listings API Routes
 * GET /api/listings - Search and browse listings
 */
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/listings
 * Search listings with filters
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async () => {
    const { searchParams } = new URL(request.url);

    const category = searchParams.get('category');
    const manufacturer = searchParams.get('manufacturer');
    const models = searchParams.getAll('models');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const condition = searchParams.get('condition');
    const site = searchParams.get('site');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = Math.min(100, parseInt(searchParams.get('pageSize') || '20', 10));

    const supabase = getSupabaseAdmin();
    let query = supabase.from('listings').select('*', { count: 'exact' });

    // Apply filters
    if (manufacturer) query = query.eq('manufacturer', manufacturer);
    if (models.length > 0) query = query.in('model', models);
    if (minPrice) query = query.gte('price', parseFloat(minPrice));
    if (maxPrice) query = query.lte('price', parseFloat(maxPrice));
    if (condition) query = query.eq('condition', condition);
    if (site) query = query.eq('site', site);

    const offset = (page - 1) * pageSize;
    query = query
      .order('scraped_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      results: data || [],
      total: count || 0,
      page,
      pageSize,
      hasMore: (count || 0) > offset + pageSize,
    });
  });
}
