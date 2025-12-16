/**
 * Tech Trade Risk Control Admin API
 * 
 * GET /api/admin/tech-trade/risk - Read current risk control state
 * POST /api/admin/tech-trade/risk - Update risk control state
 * 
 * This is an INTERNAL ADMIN endpoint. All changes are audit logged.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getRiskControlConfig,
  setRiskControlConfig,
  type RiskControlConfig,
} from '@magnus-flipper-ai/tech-trade-core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================================================
// Audit Log (In-memory for now, should be DB-backed in production)
// ============================================================================

interface AuditLogEntry {
  timestamp: string;
  admin: string;
  action: 'HALT' | 'RESUME';
  reason: string;
  previousState: {
    pricingHalted: boolean;
    haltReason?: string;
  };
  newState: {
    pricingHalted: boolean;
    haltReason?: string;
  };
}

// In-memory audit log (would be DB-backed in production)
const auditLog: AuditLogEntry[] = [];

export function getAuditLog(): AuditLogEntry[] {
  return [...auditLog].reverse(); // Most recent first
}

function addAuditEntry(entry: Omit<AuditLogEntry, 'timestamp'>): void {
  auditLog.push({
    ...entry,
    timestamp: new Date().toISOString(),
  });
  
  // Keep only last 100 entries in memory
  if (auditLog.length > 100) {
    auditLog.shift();
  }
  
  // Log to console for observability
  console.log('[RISK_CONTROL_AUDIT]', JSON.stringify({
    ...entry,
    timestamp: new Date().toISOString(),
  }));
}

// ============================================================================
// GET /api/admin/tech-trade/risk
// ============================================================================

interface RiskStatusResponse {
  pricingHalted: boolean;
  haltReason: string | null;
  haltedAt: string | null;
  haltedBy: string | null;
  source: 'env' | 'admin';
  recentChanges: AuditLogEntry[];
}

export async function GET(): Promise<NextResponse<RiskStatusResponse>> {
  const config = getRiskControlConfig();
  
  // Determine if config came from env or admin override
  const isFromEnv = process.env.TECH_TRADE_RISK_HALT === 'true' && 
                    config.haltReason?.includes('Environment variable');
  
  const response: RiskStatusResponse = {
    pricingHalted: config.pricingHalted,
    haltReason: config.haltReason || null,
    haltedAt: config.haltedAt?.toISOString() || null,
    haltedBy: config.haltedBy || null,
    source: isFromEnv ? 'env' : 'admin',
    recentChanges: getAuditLog().slice(0, 10), // Last 10 changes
  };
  
  return NextResponse.json(response);
}

// ============================================================================
// POST /api/admin/tech-trade/risk
// ============================================================================

const updateRiskSchema = z.object({
  pricingHalted: z.boolean(),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
});

interface UpdateRiskResponse {
  success: true;
  previousState: {
    pricingHalted: boolean;
    haltReason?: string;
  };
  newState: {
    pricingHalted: boolean;
    haltReason?: string;
  };
  timestamp: string;
}

interface ErrorResponse {
  success: false;
  error: string;
  code: string;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<UpdateRiskResponse | ErrorResponse>> {
  try {
    // Parse and validate request body
    const body = await request.json();
    const parseResult = updateRiskSchema.safeParse(body);
    
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: parseResult.error.errors[0]?.message || 'Invalid request',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }
    
    const { pricingHalted, reason } = parseResult.data;
    
    // Get current state before update
    const previousConfig = getRiskControlConfig();
    const previousState = {
      pricingHalted: previousConfig.pricingHalted,
      haltReason: previousConfig.haltReason,
    };
    
    // Check if this is actually a change
    if (previousConfig.pricingHalted === pricingHalted) {
      return NextResponse.json(
        {
          success: false,
          error: `Pricing is already ${pricingHalted ? 'halted' : 'active'}`,
          code: 'NO_CHANGE',
        },
        { status: 400 }
      );
    }
    
    // Get admin identifier (would come from auth in production)
    // For now, use a placeholder
    const adminId = request.headers.get('x-admin-id') || 'admin@internal';
    
    // Apply the new configuration
    const newConfig: RiskControlConfig = {
      pricingHalted,
      haltReason: reason,
      haltedAt: pricingHalted ? new Date() : undefined,
      haltedBy: pricingHalted ? adminId : undefined,
    };
    
    setRiskControlConfig(newConfig);
    
    const newState = {
      pricingHalted: newConfig.pricingHalted,
      haltReason: newConfig.haltReason,
    };
    
    // Record audit entry
    addAuditEntry({
      admin: adminId,
      action: pricingHalted ? 'HALT' : 'RESUME',
      reason,
      previousState,
      newState,
    });
    
    const timestamp = new Date().toISOString();
    
    const response: UpdateRiskResponse = {
      success: true,
      previousState,
      newState,
      timestamp,
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Risk Control Update Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

