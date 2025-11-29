/**
 * Authentication utilities for Next.js API routes
 * Provides JWT verification and user context
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from './db';
import { SubscriptionPlan } from '@magnus-flipper-ai/core';

export interface AuthenticatedUser {
  id: string;
  email?: string | null;
  stripe_customer_id?: string | null;
  subscription_plan?: SubscriptionPlan | 'TRIAL';
  subscription_status?: string | null;
  trial_expires_at?: string | null;
}

export interface AuthContext {
  user: AuthenticatedUser;
  accessToken: string;
}

/**
 * Verify JWT token and return authenticated user context
 * Throws error if authentication fails
 */
export async function requireAuth(request: NextRequest): Promise<AuthContext> {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header');
  }

  const token = authHeader.substring(7);
  const supabase = getSupabaseAdmin();

  // Verify JWT and get user
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new Error('Invalid or expired token');
  }

  // Fetch additional user details from database including subscription info
  const { data: userDetails, error: userError } = await supabase
    .from('users')
    .select('stripe_customer_id, subscription_plan, subscription_status, trial_expires_at')
    .eq('id', user.id)
    .single();

  if (userError && userError.code !== 'PGRST116') {
    console.warn('Failed to fetch user details:', userError.message);
  }

  return {
    user: {
      id: user.id,
      email: user.email || null,
      stripe_customer_id: userDetails?.stripe_customer_id || null,
      subscription_plan: userDetails?.subscription_plan || 'TRIAL',
      subscription_status: userDetails?.subscription_status || null,
      trial_expires_at: userDetails?.trial_expires_at || null,
    },
    accessToken: token,
  };
}

/**
 * Middleware-style auth handler that returns error responses
 */
export async function withAuth<T>(
  request: NextRequest,
  handler: (context: AuthContext) => Promise<T>
): Promise<T | NextResponse> {
  try {
    const context = await requireAuth(request);
    return await handler(context);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Authentication failed';
    return NextResponse.json(
      { error: message },
      { status: message.includes('Missing') ? 401 : 401 }
    );
  }
}

/**
 * Verify cron secret for scheduled tasks
 * Ensures only Vercel cron jobs can trigger endpoints
 */
export function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.warn('CRON_SECRET not set - cron endpoints are unprotected');
    return true; // Allow in development
  }

  return authHeader === `Bearer ${cronSecret}`;
}
