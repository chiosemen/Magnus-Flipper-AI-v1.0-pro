/**
 * Tech Trade Bulk/B2B Trade API Route
 * 
 * POST /api/tech-trade/business/bulk
 * 
 * Creates a bulk trade request for B2B partners.
 * This endpoint MUST reject requests when the risk halt is active.
 * This is a thin adapter - all business logic lives in tech-trade-core.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  assertBulkTradeAllowed,
  getRiskControlConfig,
  PricingHaltedError,
} from '@magnus-flipper-ai/tech-trade-core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Request validation schema
const bulkTradeItemSchema = z.object({
  deviceId: z.string().uuid('Invalid device ID format'),
  condition: z.enum(['new', 'excellent', 'good', 'fair']),
  attributes: z.record(z.string()).default({}),
  quantity: z.number().int().min(1).max(1000).default(1),
});

const bulkTradeRequestSchema = z.object({
  partnerId: z.string().min(1, 'Partner ID is required'),
  partnerReference: z.string().optional(),
  items: z.array(bulkTradeItemSchema).min(1, 'At least one item is required').max(500),
  notes: z.string().optional(),
});

type BulkTradeRequest = z.infer<typeof bulkTradeRequestSchema>;

// Response types
interface BulkTradeResponse {
  success: true;
  tradeId: string;
  partnerId: string;
  itemCount: number;
  status: 'pending_review';
  message: string;
}

interface ErrorResponse {
  success: false;
  error: string;
  code: string;
  retryable: boolean;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<BulkTradeResponse | ErrorResponse>> {
  try {
    // CRITICAL: Check risk halt FIRST before any processing
    // Bulk trades MUST be rejected when pricing is halted
    try {
      assertBulkTradeAllowed();
    } catch (error) {
      if (error instanceof PricingHaltedError) {
        const riskControl = getRiskControlConfig();
        return NextResponse.json(
          {
            success: false,
            error: 'Bulk trades are temporarily disabled due to risk controls',
            code: 'PRICING_HALTED',
            retryable: true, // Client can retry when halt is lifted
          },
          { 
            status: 503,
            headers: {
              'Retry-After': '300', // Suggest retry in 5 minutes
              'X-Halt-Reason': riskControl.haltReason || 'Risk control active',
            },
          }
        );
      }
      throw error;
    }

    // Parse and validate request body
    const body = await request.json();
    const parseResult = bulkTradeRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: parseResult.error.errors[0]?.message || 'Invalid request',
          code: 'VALIDATION_ERROR',
          retryable: false,
        },
        { status: 400 }
      );
    }

    const { partnerId, partnerReference, items, notes } = parseResult.data;

    // In production, this would:
    // 1. Validate partner credentials
    // 2. Generate quotes for all items
    // 3. Create a bulk trade record in the database
    // 4. Queue for admin review
    // 5. Send confirmation to partner

    // For now, return a placeholder response
    const tradeId = `bulk-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const response: BulkTradeResponse = {
      success: true,
      tradeId,
      partnerId,
      itemCount: items.length,
      status: 'pending_review',
      message: `Bulk trade ${tradeId} created with ${items.length} items. Pending admin review.`,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Tech Trade Bulk Trade Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        retryable: true,
      },
      { status: 500 }
    );
  }
}

