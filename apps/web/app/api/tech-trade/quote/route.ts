/**
 * Tech Trade Quote API Route
 * 
 * POST /api/tech-trade/quote
 * 
 * Generates a B2C quote for a tech device trade-in.
 * This is a thin adapter - all business logic lives in tech-trade-core.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  generateQuoteBreakdown,
  getMarketIndicators,
  getDeviceById,
  isPricingHalted,
  getRiskControlConfig,
  type Condition,
  type QuoteBreakdown,
  type MarketIndicators,
  type DeviceAttributeGroup,
  DEFAULT_PRICING_POLICY,
} from '@magnus-flipper-ai/tech-trade-core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Request validation schema
const quoteRequestSchema = z.object({
  deviceId: z.string().uuid('Invalid device ID format'),
  condition: z.enum(['new', 'excellent', 'good', 'fair']),
  attributes: z.record(z.string()).default({}),
  channel: z.enum(['b2c', 'b2b']).default('b2c'),
});

type QuoteRequest = z.infer<typeof quoteRequestSchema>;

// Response types
interface QuoteResponse {
  success: true;
  quote: {
    deviceId: string;
    device: {
      brand: string;
      model: string;
      category: string;
    };
    condition: Condition;
    attributes: Record<string, string>;
    breakdown: QuoteBreakdown;
    finalPrice: number;
    pricingFrozen: boolean;
  };
  indicators: {
    confidence: number;
    momentum: 'up' | 'down' | 'stable';
    liquidity: 'high' | 'medium' | 'low';
  };
  systemStatus: {
    pricingHalted: boolean;
    haltReason?: string;
  };
}

interface ErrorResponse {
  success: false;
  error: string;
  code: string;
}

/**
 * Map confidence score to liquidity level
 */
function confidenceToLiquidity(confidence: number): 'high' | 'medium' | 'low' {
  if (confidence >= 0.7) return 'high';
  if (confidence >= 0.4) return 'medium';
  return 'low';
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<QuoteResponse | ErrorResponse>> {
  try {
    // Parse and validate request body
    const body = await request.json();
    const parseResult = quoteRequestSchema.safeParse(body);

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

    const { deviceId, condition, attributes, channel } = parseResult.data;

    // Get device from catalog
    const device = await getDeviceById(deviceId);
    if (!device) {
      return NextResponse.json(
        {
          success: false,
          error: `Device not found: ${deviceId}`,
          code: 'DEVICE_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Build policy (in production, fetch from DB)
    // For now, use default policy with generated ID
    const policy = {
      ...DEFAULT_PRICING_POLICY,
      id: 'default-policy',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Generate quote breakdown
    // Note: In production, anchors and device attributes would come from DB
    const breakdown = generateQuoteBreakdown({
      device,
      condition,
      attributes,
      deviceAttributes: device.attributes?.flatMap((group: DeviceAttributeGroup) => 
        group.modifiers.map((mod: { value: string; priceModifier: number }) => ({
          id: `${device.id}-${group.type}-${mod.value}`,
          deviceId: device.id,
          attributeType: group.type,
          attributeValue: mod.value,
          priceModifier: mod.priceModifier,
          createdAt: new Date(),
        }))
      ) || [],
      anchors: [], // In production, fetch approved anchors from DB
      policy,
    });

    // Get market indicators for this device
    const indicators = await getMarketIndicators({ deviceId });

    // Get current risk control state
    const riskControl = getRiskControlConfig();

    const response: QuoteResponse = {
      success: true,
      quote: {
        deviceId: device.id,
        device: {
          brand: device.brand,
          model: device.model,
          category: device.category,
        },
        condition,
        attributes,
        breakdown,
        finalPrice: breakdown.finalPrice,
        pricingFrozen: breakdown.pricingFrozen,
      },
      indicators: {
        confidence: indicators.confidence.overall,
        momentum: indicators.momentum.trend,
        liquidity: confidenceToLiquidity(indicators.confidence.overall),
      },
      systemStatus: {
        pricingHalted: riskControl.pricingHalted,
        haltReason: riskControl.haltReason,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Tech Trade Quote Error:', error);

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

