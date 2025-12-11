import { NextRequest, NextResponse } from 'next/server';
import { getMarketplaceProfile } from '@magnus-flipper-ai/marketplace-config';
import { getGuardrails, applyGuardrails } from '@magnus-flipper-ai/compliance-shield/guardrails';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/compliance/guardrails
 * Returns guardrail configuration for a marketplace
 * 
 * Query params:
 * - marketplace: Marketplace ID (required)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const marketplace = searchParams.get('marketplace');

    if (!marketplace) {
      return NextResponse.json(
        { error: 'Marketplace parameter required' },
        { status: 400 }
      );
    }

    const profile = getMarketplaceProfile(marketplace);
    const guardrails = getGuardrails(profile);

    return NextResponse.json({
      marketplace,
      guardrails,
      profile: {
        riskLevel: profile.riskLevel,
        throttleBudget: profile.throttleBudget,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching guardrails:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch guardrails',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/compliance/guardrails/validate
 * Validates a throttle multiplier against guardrails
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { marketplace, proposedMultiplier, successRate, isEmergencyMode } = body;

    if (!marketplace || proposedMultiplier === undefined || successRate === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: marketplace, proposedMultiplier, successRate' },
        { status: 400 }
      );
    }

    const profile = getMarketplaceProfile(marketplace);
    const result = applyGuardrails(
      profile,
      proposedMultiplier,
      successRate,
      isEmergencyMode || false
    );

    return NextResponse.json({
      marketplace,
      input: {
        proposedMultiplier,
        successRate,
        isEmergencyMode: isEmergencyMode || false,
      },
      output: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error validating guardrails:', error);
    return NextResponse.json(
      {
        error: 'Failed to validate guardrails',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
