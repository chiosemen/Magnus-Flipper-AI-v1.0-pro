/**
 * Saved Search by ID API Routes
 * GET /api/saved-searches/:id - Get specific saved search
 * PATCH /api/saved-searches/:id - Update saved search
 * DELETE /api/saved-searches/:id - Delete saved search
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const updateSavedSearchSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  category: z.string().min(1).optional(),
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
  maxResultsPerRun: z.number().min(1).max(100).optional(),
  active: z.boolean().optional(),
});

/**
 * GET /api/saved-searches/:id
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async ({ user }) => {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('saved_searches')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Saved search not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  });
}

/**
 * PATCH /api/saved-searches/:id
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async ({ user }) => {
    try {
      const body = await request.json();
      const parsed = updateSavedSearchSchema.parse(body);

      // Build update object
      const updates: any = {
        updated_at: new Date().toISOString(),
      };

      if (parsed.name !== undefined) updates.name = parsed.name;
      if (parsed.category !== undefined) updates.category = parsed.category;
      if (parsed.manufacturer !== undefined) updates.manufacturer = parsed.manufacturer;
      if (parsed.models !== undefined) updates.models = parsed.models;
      if (parsed.minPrice !== undefined) updates.min_price = parsed.minPrice;
      if (parsed.maxPrice !== undefined) updates.max_price = parsed.maxPrice;
      if (parsed.radiusMiles !== undefined) updates.radius_miles = parsed.radiusMiles;
      if (parsed.locationCity !== undefined) updates.location_city = parsed.locationCity;
      if (parsed.locationLat !== undefined) updates.location_lat = parsed.locationLat;
      if (parsed.locationLng !== undefined) updates.location_lng = parsed.locationLng;
      if (parsed.conditions !== undefined) updates.conditions = parsed.conditions;
      if (parsed.sites !== undefined) updates.sites = parsed.sites;
      if (parsed.maxResultsPerRun !== undefined) updates.max_results_per_run = parsed.maxResultsPerRun;
      if (parsed.active !== undefined) updates.active = parsed.active;

      const supabase = getSupabaseAdmin();

      const { data, error } = await supabase
        .from('saved_searches')
        .update(updates)
        .eq('id', params.id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error || !data) {
        return NextResponse.json({ error: 'Saved search not found' }, { status: 404 });
      }

      return NextResponse.json(data);
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

/**
 * DELETE /api/saved-searches/:id
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async ({ user }) => {
    const supabase = getSupabaseAdmin();

    const { error } = await supabase
      .from('saved_searches')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return new NextResponse(null, { status: 204 });
  });
}
