/**
 * Health Check Endpoint
 * Provides system health status for load balancers and monitoring
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

interface HealthResponse {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    web: boolean;
    supabase: boolean;
  };
  dependencies: {
    supabase: {
      status: 'ok' | 'degraded' | 'down';
      responseTimeMs?: number;
    };
  };
}

const startTime = Date.now();

export async function GET() {
  const checks = {
    web: true,
    supabase: false,
  };

  const dependencies: HealthResponse['dependencies'] = {
    supabase: {
      status: 'down',
    },
  };

  let overallStatus: 'ok' | 'degraded' | 'down' = 'ok';

  // Check Supabase connectivity
  // In preview environments, gracefully degrade if credentials are missing
  const isPreview = process.env.VERCEL_ENV === 'preview' || process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview';
  
  if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabaseStart = Date.now();
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      
      // Simple query to verify connectivity
      const { error } = await supabase.from('worker_logs').select('count').limit(1);
      const supabaseEnd = Date.now();
      const responseTime = supabaseEnd - supabaseStart;

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = table not found (acceptable for health check)
        throw error;
      }

      checks.supabase = true;
      dependencies.supabase = {
        status: 'ok',
        responseTimeMs: responseTime,
      };
    } catch (error: any) {
      checks.supabase = false;
      dependencies.supabase = {
        status: 'down',
      };
      // In preview, degraded is acceptable; in production, this is a concern
      overallStatus = isPreview ? 'degraded' : 'degraded';
    }
  } else {
    // If Supabase not configured, mark as degraded (acceptable in preview)
    if (isPreview) {
      // Preview environments may not have all credentials - this is acceptable
      dependencies.supabase.status = 'degraded';
      overallStatus = 'ok'; // Web is up, which is sufficient for preview
    } else {
      overallStatus = 'degraded';
      dependencies.supabase.status = 'degraded';
    }
  }

  // Determine overall status
  if (!checks.web) {
    overallStatus = 'down';
  }

  const response: HealthResponse = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    checks,
    dependencies,
  };

  const statusCode = overallStatus === 'down' ? 503 : 200;

  return NextResponse.json(response, { status: statusCode });
}
