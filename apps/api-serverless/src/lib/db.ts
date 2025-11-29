/**
 * Supabase database client for serverless API
 * Optimized for Vercel Edge/Serverless with connection pooling
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
}

// Singleton Supabase client for serverless
let supabaseAdminInstance: SupabaseClient | null = null;

/**
 * Get Supabase admin client (service role)
 * Uses singleton pattern to reuse connections in serverless
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdminInstance) {
    supabaseAdminInstance = createClient(supabaseUrl!, supabaseServiceKey!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          'x-application-name': 'magnus-flipper-api',
        },
      },
    });
  }
  return supabaseAdminInstance;
}

/**
 * Create a user-scoped Supabase client
 * For operations that should respect RLS policies
 */
export function createUserClient(accessToken: string): SupabaseClient {
  return createClient(supabaseUrl!, supabaseServiceKey!, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Prisma client with connection pooling for serverless
 * Uses Prisma Data Proxy or direct connection with pgBouncer
 */
import { db as prisma } from '@magnus-flipper-ai/core';

export { prisma };
