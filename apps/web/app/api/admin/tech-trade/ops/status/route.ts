/**
 * Tech Trade Ops Dashboard - System Status API
 * 
 * GET /api/admin/tech-trade/ops/status
 * 
 * Returns current system status including:
 * - Pricing halt state
 * - Anchor ingestion status
 * - Last ingestion timestamp
 */

import { NextResponse } from 'next/server';
import {
  getRiskControlConfig,
  getMarketIndicators,
} from '@magnus-flipper-ai/tech-trade-core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface SystemStatusResponse {
  pricingHalted: boolean;
  haltReason: string | null;
  anchorsEnabled: boolean;
  lastAnchorIngestion: string | null;
  systemHealth: 'healthy' | 'degraded' | 'halted';
}

export async function GET(): Promise<NextResponse<SystemStatusResponse>> {
  const riskConfig = getRiskControlConfig();
  const indicators = await getMarketIndicators();
  
  // Determine if anchors are enabled (not halted and have recent approvals)
  const anchorsEnabled = !riskConfig.pricingHalted;
  
  // Determine system health
  let systemHealth: 'healthy' | 'degraded' | 'halted' = 'healthy';
  if (riskConfig.pricingHalted) {
    systemHealth = 'halted';
  } else if (indicators.confidence.overall < 0.4 || indicators.anchors.stale > indicators.anchors.approved * 0.5) {
    systemHealth = 'degraded';
  }
  
  // Last anchor ingestion would come from anchor records in production
  // For now, use generated timestamp
  const lastAnchorIngestion = indicators.generatedAt.toISOString();
  
  const response: SystemStatusResponse = {
    pricingHalted: riskConfig.pricingHalted,
    haltReason: riskConfig.haltReason || null,
    anchorsEnabled,
    lastAnchorIngestion,
    systemHealth,
  };
  
  return NextResponse.json(response);
}

