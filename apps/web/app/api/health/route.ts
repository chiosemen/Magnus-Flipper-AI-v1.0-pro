/**
 * Health Check Endpoint
 * Provides application health status, uptime, and dependency checks
 */

import { NextResponse } from 'next/server';
import { checkWorkerHeartbeat, getWorkerHealthSummary } from '@/lib/observability/worker-monitor';
import { logInfo } from '@/lib/observability/logger';

// Track application start time
const APP_START_TIME = Date.now();

/**
 * Check Supabase connectivity
 */
async function checkSupabaseHealth(): Promise<'ok' | 'degraded' | 'down'> {
  try {
    const { createServerClient } = await import('@/lib/supabase/server');
    const supabase = await createServerClient();
    
    // Simple health check query
    const { error } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned (acceptable)
      return 'degraded';
    }
    
    return 'ok';
  } catch (error) {
    return 'down';
  }
}

/**
 * Check Stripe connectivity
 */
async function checkStripeHealth(): Promise<'ok' | 'degraded' | 'down'> {
  try {
    const { getStripeClient } = await import('@/lib/stripe');
    const stripe = getStripeClient();
    
    // Simple API call to check connectivity
    await stripe.balance.retrieve();
    
    return 'ok';
  } catch (error) {
    // If it's an auth error, service is reachable but misconfigured
    if (error instanceof Error && error.message.includes('api_key')) {
      return 'degraded';
    }
    return 'down';
  }
}

/**
 * GET /api/health
 * Returns application health status
 */
export async function GET() {
  try {
    const start = performance.now();
    
    // Parallel health checks
    const [supabaseHealth, stripeHealth, workerHealth] = await Promise.all([
      checkSupabaseHealth(),
      checkStripeHealth(),
      getWorkerHealthSummary(),
    ]);
    
    const uptime = Math.floor((Date.now() - APP_START_TIME) / 1000); // seconds
    
    // Determine overall status
    const overallStatus = 
      supabaseHealth === 'ok' && stripeHealth === 'ok' && workerHealth.online > 0
        ? 'ok'
        : supabaseHealth === 'down' || stripeHealth === 'down'
        ? 'down'
        : 'degraded';
    
    const response = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime,
      env: process.env.NODE_ENV || 'development',
      version: '0.1.0', // From package.json
      dependencies: {
        supabase: supabaseHealth,
        stripe: stripeHealth,
      },
      workers: {
        total: workerHealth.total,
        online: workerHealth.online,
        stale: workerHealth.stale,
        offline: workerHealth.offline,
        status: workerHealth.online > 0 ? 'ok' : 'degraded',
      },
      checks: {
        duration_ms: Math.round(performance.now() - start),
      },
    };
    
    // Log health check
    logInfo('Health check completed', {
      status: overallStatus,
      uptime,
      dependencies: response.dependencies,
      workers: response.workers,
    });
    
    // Return appropriate status code
    const statusCode = overallStatus === 'ok' ? 200 : overallStatus === 'degraded' ? 200 : 503;
    
    return NextResponse.json(response, { status: statusCode });
  } catch (error) {
    logInfo('Health check failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    
    return NextResponse.json(
      {
        status: 'down',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      },
      { status: 503 }
    );
  }
}
