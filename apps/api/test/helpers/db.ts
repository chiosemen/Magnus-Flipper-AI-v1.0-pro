import { createClient } from '@supabase/supabase-js';

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://postgres:test@localhost:5433/magnus_test';

/**
 * Get a Supabase client for test database
 */
export function getTestSupabaseClient() {
  // Extract connection details from DATABASE_URL
  const url = new URL(TEST_DATABASE_URL.replace('postgresql://', 'https://'));
  const supabaseUrl = `https://${url.hostname}`;
  const supabaseKey = url.password || 'test-key';

  return createClient(supabaseUrl, supabaseKey, {
    db: {
      schema: 'public',
    },
    auth: {
      persistSession: false,
    },
  });
}

/**
 * Seed a test user with profile
 */
export async function seedTestUser(params: {
  userId: string;
  email?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  marketAgentEnabled?: boolean;
  marketAgentStatus?: string;
}) {
  const supabase = getTestSupabaseClient();
  
  const { error } = await supabase.from('profiles').upsert({
    id: params.userId,
    email: params.email || `test-${params.userId}@example.com`,
    stripe_customer_id: params.stripeCustomerId || null,
    stripe_subscription_id: params.stripeSubscriptionId || null,
    market_agent_enabled: params.marketAgentEnabled ?? false,
    market_agent_status: params.marketAgentStatus || 'canceled',
    grace_until: null,
  });

  if (error) {
    throw new Error(`Failed to seed test user: ${error.message}`);
  }

  return params.userId;
}

/**
 * Clean up test data
 */
export async function cleanupTestUser(userId: string) {
  const supabase = getTestSupabaseClient();
  
  await supabase.from('profiles').delete().eq('id', userId);
  await supabase.from('market_agent_usage_events').delete().eq('user_id', userId);
  await supabase.from('market_agent_usage_rollups_daily').delete().eq('user_id', userId);
  await supabase.from('stripe_webhook_events').delete().eq('stripe_customer_id', userId);
}

/**
 * Reset all test tables (truncate)
 */
export async function resetTestDatabase() {
  const supabase = getTestSupabaseClient();
  
  // Get list of tables
  const { data: tables } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
        AND tablename NOT LIKE 'pg_%'
        AND tablename NOT LIKE '_supabase_%'
    `,
  });

  if (!tables || tables.length === 0) {
    return;
  }

  // Truncate all tables
  const tableNames = (tables as any[]).map((t) => t.tablename).join(', ');
  await supabase.rpc('exec_sql', {
    sql: `TRUNCATE TABLE ${tableNames} CASCADE`,
  });
}

