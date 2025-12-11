// apps/web/app/api/admin/marketplace-controls/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  getAllMarketplaceControls,
  upsertMarketplaceControl
} from '@magnus-flipper-ai/core/services/marketplaceControlService';

// Optional: enforce admin auth if you have requireAdmin()
// import { requireAdmin } from '@/lib/auth';

export async function GET() {
  // await requireAdmin();
  const controls = await getAllMarketplaceControls();
  return NextResponse.json({ controls });
}

export async function POST(req: NextRequest) {
  // await requireAdmin();
  const body = await req.json().catch(() => null);

  if (
    !body ||
    typeof body.marketplace !== 'string' ||
    typeof body.enabled !== 'boolean' ||
    typeof body.maxConcurrency !== 'number'
  ) {
    return NextResponse.json(
      { error: 'Invalid payload' },
      { status: 400 }
    );
  }

  const maxConcurrency = Math.max(
    1,
    Math.min(50, Math.floor(body.maxConcurrency))
  );

  const control = await upsertMarketplaceControl({
    marketplace: body.marketplace,
    enabled: body.enabled,
    maxConcurrency
  });

  return NextResponse.json({ control });
}
