/**
 * Saved Searches API Routes
 * GET /api/saved-searches - List all saved searches
 * POST /api/saved-searches - Create new saved search
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const createSavedSearchSchema = z.object({
  name: z.string().min(2).max(100),
  category: z.string().min(1),
  manufacturer: z.string().optional(),
  models: z.array(z.string()).optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  radiusMiles: z.number().min(0).max(500).optional(),
  locationCity: z.string().optional(),
  locationLat: z.number().min(-90).max(90).optional(),
  locationLng: z.number().min(-180).max(180).optional(),
  conditions: z.array(z.string()).optional(),
  sites: z.array(z.string()).optional(),
  maxResultsPerRun: z.number().min(1).max(100).default(20),
  active: z.boolean().default(true),
});

/**
 * GET /api/saved-searches
 * List all saved searches for authenticated user
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async ({ user }) => {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('saved_searches')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  });
}

/**
 * POST /api/saved-searches
 * Create a new saved search
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async ({ user }) => {
    try {
      const body = await request.json();
      const parsed = createSavedSearchSchema.parse(body);

      const supabase = getSupabaseAdmin();

      const { data, error } = await supabase
        .from('saved_searches')
        .insert({
          user_id: user.id,
          name: parsed.name,
          category: parsed.category,
          manufacturer: parsed.manufacturer || null,
          models: parsed.models || [],
          min_price: parsed.minPrice || null,
          max_price: parsed.maxPrice || null,
          radius_miles: parsed.radiusMiles || null,
          location_city: parsed.locationCity || null,
          location_lat: parsed.locationLat || null,
          location_lng: parsed.locationLng || null,
          conditions: parsed.conditions || [],
          sites: parsed.sites || [],
          max_results_per_run: parsed.maxResultsPerRun,
          active: parsed.active,
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(data, { status: 201 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid request body', details: error.errors },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
  });
}
