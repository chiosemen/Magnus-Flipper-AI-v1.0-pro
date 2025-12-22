/**
 * Feature Flags System
 * 
 * Runtime feature control with precedence:
 * 1. ENV override (highest)
 * 2. DB flag
 * 3. Hardcoded default (lowest)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface FeatureFlag {
  key: string;
  enabled: boolean;
  description?: string;
  rollout?: number | null;
  updated_at: string;
}

interface FlagCache {
  flags: Map<string, FeatureFlag>;
  lastFetch: number;
  ttl: number; // milliseconds
}

// In-memory cache
let cache: FlagCache = {
  flags: new Map(),
  lastFetch: 0,
  ttl: 30000, // 30 seconds
};

let supabaseClient: SupabaseClient | null = null;

/**
 * Initialize feature flags client
 */
export function initFeatureFlags(supabaseUrl: string, supabaseKey: string): void {
  supabaseClient = createClient(supabaseUrl, supabaseKey);
  
  if (process.env.DEBUG_FLAGS === 'true') {
    console.log('[Feature Flags] Initialized');
  }
}

/**
 * Get a single feature flag
 * 
 * Precedence:
 * 1. ENV override (FEATURE_<KEY>=true/false)
 * 2. DB flag
 * 3. Default (false in prod, true in dev for some flags)
 */
export async function getFlag(
  key: string,
  context?: { userId?: string; workspaceId?: string }
): Promise<boolean> {
  // 1. Check ENV override (highest priority)
  const envKey = `FEATURE_${key}`;
  const envValue = process.env[envKey];
  if (envValue !== undefined) {
    const enabled = envValue === 'true' || envValue === '1';
    if (process.env.DEBUG_FLAGS === 'true') {
      console.log(`[Feature Flags] ${key}: ${enabled} (ENV override)`);
    }
    return enabled;
  }

  // 2. Check cache
  const now = Date.now();
  if (now - cache.lastFetch < cache.ttl && cache.flags.has(key)) {
    const flag = cache.flags.get(key)!;
    return evaluateFlag(flag, context);
  }

  // 3. Fetch from DB if client is initialized
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('feature_flags')
        .select('*')
        .eq('key', key)
        .single();

      if (!error && data) {
        const flag: FeatureFlag = data;
        cache.flags.set(key, flag);
        cache.lastFetch = now;
        
        if (process.env.DEBUG_FLAGS === 'true') {
          console.log(`[Feature Flags] ${key}: ${flag.enabled} (DB)`);
        }
        
        return evaluateFlag(flag, context);
      }
    } catch (error) {
      console.warn(`[Feature Flags] Error fetching flag ${key}:`, error);
    }
  }

  // 4. Default based on flag and environment
  const isDev = process.env.NODE_ENV === 'development';
  const defaults: Record<string, boolean> = {
    FEATURE_ELITE_POOL_DISPATCH: false,
    FEATURE_SCRAPE_DISPATCH: true,
    FEATURE_ECONOMICS_PIPELINE: true,
    FEATURE_UI_CAR_FLIPPER: true,
    FEATURE_UI_MARKETPLACE_MONITOR_STYLE: true,
    FEATURE_DEV_PLACEHOLDERS_ALWAYS_ON: isDev, // true in dev, false in prod
  };

  const defaultValue = defaults[key] ?? false;
  
  if (process.env.DEBUG_FLAGS === 'true') {
    console.log(`[Feature Flags] ${key}: ${defaultValue} (default)`);
  }
  
  return defaultValue;
}

/**
 * Evaluate flag with rollout percentage
 */
function evaluateFlag(flag: FeatureFlag, context?: { userId?: string; workspaceId?: string }): boolean {
  if (!flag.enabled) {
    return false;
  }

  // If no rollout specified, use enabled flag
  if (flag.rollout === null || flag.rollout === undefined) {
    return flag.enabled;
  }

  // If rollout is 100%, always enabled
  if (flag.rollout >= 100) {
    return true;
  }

  // If rollout is 0%, always disabled
  if (flag.rollout <= 0) {
    return false;
  }

  // For rollout percentage, hash userId or workspaceId
  if (context?.userId || context?.workspaceId) {
    const id = context.userId || context.workspaceId || '';
    const hash = simpleHash(id);
    const percentage = hash % 100;
    return percentage < flag.rollout;
  }

  // No context, use enabled flag
  return flag.enabled;
}

/**
 * Simple hash function for rollout
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Get multiple flags at once
 */
export async function getFlags(
  keys: string[],
  context?: { userId?: string; workspaceId?: string }
): Promise<Record<string, boolean>> {
  const results: Record<string, boolean> = {};
  
  await Promise.all(
    keys.map(async (key) => {
      results[key] = await getFlag(key, context);
    })
  );
  
  return results;
}

/**
 * Clear cache (useful for testing)
 */
export function clearFlagCache(): void {
  cache.flags.clear();
  cache.lastFetch = 0;
}

/**
 * Print current flag status (for debugging)
 */
export async function printFlagStatus(): Promise<void> {
  const flags = [
    'FEATURE_ELITE_POOL_DISPATCH',
    'FEATURE_SCRAPE_DISPATCH',
    'FEATURE_ECONOMICS_PIPELINE',
    'FEATURE_UI_CAR_FLIPPER',
    'FEATURE_UI_MARKETPLACE_MONITOR_STYLE',
    'FEATURE_DEV_PLACEHOLDERS_ALWAYS_ON',
  ];

  console.log('\n[Feature Flags] Current Status:');
  console.log('─'.repeat(60));
  
  for (const key of flags) {
    const enabled = await getFlag(key);
    const source = process.env[`FEATURE_${key}`] ? 'ENV' : 
                   cache.flags.has(key) ? 'DB' : 'DEFAULT';
    console.log(`  ${key}: ${enabled ? '✅' : '❌'} (${source})`);
  }
  
  console.log('─'.repeat(60));
}

