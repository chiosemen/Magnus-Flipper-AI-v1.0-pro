// apps/web/app/api/admin/marketplaces/route.ts
// Simple marketplace toggle API (complementary to marketplace-controls API)
import { NextRequest, NextResponse } from 'next/server';
import {
  getAllMarketplaceControls,
  upsertMarketplaceControl
} from '@magnus-flipper-ai/core/services/marketplaceControlService';
import { MARKETPLACE_PROFILES } from '@magnus-flipper-ai/marketplace-config';

export async function GET() {
  // Return all marketplace configs with their control states
  const controls = await getAllMarketplaceControls();
  const controlsMap = new Map(controls.map(c => [c.marketplace, c]));

  const result = Object.entries(MARKETPLACE_PROFILES).map(([name, profile]) => {
    const control = controlsMap.get(name);
    return {
      marketplace: name,
      displayName: profile.displayName,
      enabled: control?.enabled ?? true,
      maxConcurrency: control?.maxConcurrency ?? profile.maxConcurrentRequestsPerIp,
      maxRequestsPerMinute: profile.maxRequestsPerMinutePerIp,
      riskLevel: profile.riskLevel,
      notes: profile.notes
    };
  });

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body.marketplace !== 'string' || typeof body.enabled !== 'boolean') {
    return NextResponse.json(
      { error: 'Invalid payload. Requires: { marketplace: string, enabled: boolean }' },
      { status: 400 }
    );
  }

  // Get existing control or use defaults
  const controls = await getAllMarketplaceControls();
  const existing = controls.find(c => c.marketplace === body.marketplace);
  const profile = MARKETPLACE_PROFILES[body.marketplace as keyof typeof MARKETPLACE_PROFILES];

  if (!profile) {
    return NextResponse.json(
      { error: `Unknown marketplace: ${body.marketplace}` },
      { status: 400 }
    );
  }

  const control = await upsertMarketplaceControl({
    marketplace: body.marketplace,
    enabled: body.enabled,
    maxConcurrency: existing?.maxConcurrency ?? profile.maxConcurrentRequestsPerIp
  });

  return NextResponse.json({ status: 'ok', control });
}
