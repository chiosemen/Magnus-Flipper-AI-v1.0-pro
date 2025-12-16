/**
 * Tech Trade Ops Dashboard - Top Movers API
 * 
 * GET /api/admin/tech-trade/ops/movers
 * 
 * Returns devices with largest price changes over 7 days.
 * Includes direction, percentage change, and confidence score.
 */

import { NextResponse } from 'next/server';
import {
  getMarketIndicators,
} from '@magnus-flipper-ai/tech-trade-core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface TopMover {
  deviceId: string;
  brand: string;
  model: string;
  category: string;
  change7d: number;
  change30d: number;
  direction: 'up' | 'down' | 'stable';
  confidence: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  currentPrice: number;
  previousPrice: number;
}

interface TopMoversResponse {
  movers: TopMover[];
  generatedAt: string;
}

// Mock top movers data - in production this would come from actual device/anchor data
const MOCK_TOP_MOVERS: TopMover[] = [
  {
    deviceId: 'device-001',
    brand: 'Apple',
    model: 'iPhone 15 Pro Max',
    category: 'smartphone',
    change7d: 12.3,
    change30d: 8.5,
    direction: 'up',
    confidence: 0.89,
    confidenceLevel: 'high',
    currentPrice: 1149,
    previousPrice: 1023,
  },
  {
    deviceId: 'device-002',
    brand: 'Samsung',
    model: 'Galaxy S24 Ultra',
    category: 'smartphone',
    change7d: -8.7,
    change30d: -12.1,
    direction: 'down',
    confidence: 0.76,
    confidenceLevel: 'high',
    currentPrice: 899,
    previousPrice: 985,
  },
  {
    deviceId: 'device-003',
    brand: 'Google',
    model: 'Pixel 8 Pro',
    category: 'smartphone',
    change7d: 6.2,
    change30d: 4.1,
    direction: 'up',
    confidence: 0.45,
    confidenceLevel: 'medium',
    currentPrice: 699,
    previousPrice: 658,
  },
  {
    deviceId: 'device-004',
    brand: 'Apple',
    model: 'MacBook Pro 14"',
    category: 'laptop',
    change7d: -5.4,
    change30d: -3.2,
    direction: 'down',
    confidence: 0.82,
    confidenceLevel: 'high',
    currentPrice: 1599,
    previousPrice: 1690,
  },
  {
    deviceId: 'device-005',
    brand: 'Apple',
    model: 'iPad Pro 12.9"',
    category: 'tablet',
    change7d: 3.8,
    change30d: 2.1,
    direction: 'up',
    confidence: 0.68,
    confidenceLevel: 'medium',
    currentPrice: 899,
    previousPrice: 866,
  },
  {
    deviceId: 'device-006',
    brand: 'Sony',
    model: 'PlayStation 5',
    category: 'console',
    change7d: -11.2,
    change30d: -15.8,
    direction: 'down',
    confidence: 0.71,
    confidenceLevel: 'high',
    currentPrice: 399,
    previousPrice: 449,
  },
  {
    deviceId: 'device-007',
    brand: 'Apple',
    model: 'Watch Ultra 2',
    category: 'wearable',
    change7d: 2.1,
    change30d: 5.4,
    direction: 'up',
    confidence: 0.33,
    confidenceLevel: 'low',
    currentPrice: 649,
    previousPrice: 636,
  },
  {
    deviceId: 'device-008',
    brand: 'Microsoft',
    model: 'Xbox Series X',
    category: 'console',
    change7d: -7.3,
    change30d: -9.1,
    direction: 'down',
    confidence: 0.58,
    confidenceLevel: 'medium',
    currentPrice: 349,
    previousPrice: 377,
  },
];

export async function GET(): Promise<NextResponse<TopMoversResponse>> {
  const indicators = await getMarketIndicators();
  
  // Sort by absolute change (biggest movers first)
  const sortedMovers = [...MOCK_TOP_MOVERS].sort(
    (a, b) => Math.abs(b.change7d) - Math.abs(a.change7d)
  );
  
  // Adjust confidence based on actual market indicators
  // This simulates how real data would influence confidence
  const adjustedMovers = sortedMovers.map(mover => ({
    ...mover,
    // Scale confidence by overall market confidence factor
    confidence: Math.min(1, mover.confidence * (0.5 + indicators.confidence.factors.freshness * 0.5)),
    confidenceLevel: mover.confidence >= 0.7 ? 'high' as const
      : mover.confidence >= 0.4 ? 'medium' as const
      : 'low' as const,
  }));
  
  const response: TopMoversResponse = {
    movers: adjustedMovers.slice(0, 10), // Top 10
    generatedAt: indicators.generatedAt.toISOString(),
  };
  
  return NextResponse.json(response);
}

