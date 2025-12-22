/**
 * Feature Flags API Route
 * Returns public feature flags for the web app
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

export async function GET() {
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { error: 'Supabase not configured' },
      { status: 500 }
    );
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Fetch public flags (UI flags only)
    const { data, error } = await supabase
      .from('feature_flags')
      .select('key, enabled, rollout')
      .in('key', [
        'FEATURE_UI_CAR_FLIPPER',
        'FEATURE_UI_MARKETPLACE_MONITOR_STYLE',
        'FEATURE_DEV_PLACEHOLDERS_ALWAYS_ON',
      ]);

    if (error) {
      console.error('Error fetching feature flags:', error);
      return NextResponse.json(
        { error: 'Failed to fetch flags' },
        { status: 500 }
      );
    }

    // Convert to record format
    const flags: Record<string, boolean> = {};
    
    // Check ENV overrides first (highest priority)
    const flagKeys = [
      'FEATURE_UI_CAR_FLIPPER',
      'FEATURE_UI_MARKETPLACE_MONITOR_STYLE',
      'FEATURE_DEV_PLACEHOLDERS_ALWAYS_ON',
    ];

    for (const key of flagKeys) {
      const envKey = `NEXT_PUBLIC_${key}`;
      if (process.env[envKey] !== undefined) {
        flags[key] = process.env[envKey] === 'true' || process.env[envKey] === '1';
      } else {
        // Use DB value
        const flag = data?.find((f) => f.key === key);
        flags[key] = flag?.enabled ?? false;
      }
    }

    return NextResponse.json({ flags });
  } catch (error) {
    console.error('Error in flags API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

