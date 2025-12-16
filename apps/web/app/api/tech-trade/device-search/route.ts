/**
 * Tech Trade Device Search API Route
 * 
 * GET /api/tech-trade/device-search?q=iPhone&brand=Apple&category=smartphone
 * 
 * Searches the device catalog for tech devices.
 * This is a thin adapter - all business logic lives in tech-trade-core.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  searchDevices,
  type DeviceSearchResult,
  type TechDeviceWithAttributes,
} from '@magnus-flipper-ai/tech-trade-core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Query parameter validation schema
const searchParamsSchema = z.object({
  q: z.string().optional(),
  brand: z.string().optional(),
  category: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Response types
interface SearchResponse {
  success: true;
  devices: Array<{
    id: string;
    brand: string;
    model: string;
    category: string;
    releaseYear: number;
    basePrice: number;
    currency: string;
    attributes: Array<{
      type: string;
      values: string[];
    }>;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ErrorResponse {
  success: false;
  error: string;
  code: string;
}

/**
 * Transform device to API response format
 */
function transformDevice(device: TechDeviceWithAttributes) {
  return {
    id: device.id,
    brand: device.brand,
    model: device.model,
    category: device.category,
    releaseYear: device.releaseYear,
    basePrice: device.basePrice,
    currency: device.currency,
    attributes: device.attributes.map(attr => ({
      type: attr.type,
      values: attr.values,
    })),
  };
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<SearchResponse | ErrorResponse>> {
  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const params = {
      q: searchParams.get('q') || undefined,
      brand: searchParams.get('brand') || undefined,
      category: searchParams.get('category') || undefined,
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
    };

    // Validate parameters
    const parseResult = searchParamsSchema.safeParse(params);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: parseResult.error.errors[0]?.message || 'Invalid parameters',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    const { q, brand, category, page, limit } = parseResult.data;

    // Search devices using tech-trade-core
    const result = await searchDevices({
      query: q,
      brand,
      category,
      page,
      limit,
    });

    const response: SearchResponse = {
      success: true,
      devices: result.devices.map(transformDevice),
      pagination: result.pagination,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Tech Trade Device Search Error:', error);

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

