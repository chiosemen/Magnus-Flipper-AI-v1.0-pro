/**
 * Detailed Health Check Endpoint
 * Provides comprehensive system health with all dependencies
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

interface DetailedHealthResponse {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    web: {
      status: 'ok' | 'degraded' | 'down';
      message: string;
    };
    supabase: {
      status: 'ok' | 'degraded' | 'down';
      message: string;
      responseTimeMs?: number;
      connected: boolean;
    };
  };
  metrics: {
    memoryUsage?: NodeJS.MemoryUsage;
    nodeVersion: string;
  };
}

const startTime = Date.now();

export async function GET() {
  const checks: DetailedHealthResponse['checks'] = {
    web: {
      status: 'ok',
      message: 'Web server is operational',
    },
    supabase: {
      status: 'down',
      message: 'Not configured',
      connected: false,
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
      
      // Test query
      const { error } = await supabase.from('worker_logs').select('count').limit(1);
      const supabaseEnd = Date.now();
      const responseTime = supabaseEnd - supabaseStart;

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      checks.supabase = {
        status: 'ok',
        message: 'Supabase connection healthy',
        responseTimeMs: responseTime,
        connected: true,
      };
    } catch (error: any) {
      checks.supabase = {
        status: 'down',
        message: `Supabase connection failed: ${error.message}`,
        connected: false,
      };
      // In preview, degraded is acceptable; in production, this is a concern
      overallStatus = isPreview ? 'degraded' : 'degraded';
    }
  } else {
    // If Supabase not configured, mark as degraded (acceptable in preview)
    if (isPreview) {
      checks.supabase = {
        status: 'degraded',
        message: 'Supabase credentials not configured (preview environment)',
        connected: false,
      };
      // Preview environments may not have all credentials - web being up is sufficient
      overallStatus = 'ok';
    } else {
      checks.supabase = {
        status: 'degraded',
        message: 'Supabase credentials not configured',
        connected: false,
      };
      overallStatus = 'degraded';
    }
  }

  const response: DetailedHealthResponse = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    checks,
    metrics: {
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version,
    },
  };

  const statusCode = overallStatus === 'down' ? 503 : 200;

  return NextResponse.json(response, { status: statusCode });
}
