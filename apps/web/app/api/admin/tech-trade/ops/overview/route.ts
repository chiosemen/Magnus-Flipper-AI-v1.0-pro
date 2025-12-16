/**
 * Tech Trade Ops Dashboard - Market Overview API
 * 
 * GET /api/admin/tech-trade/ops/overview
 * 
 * Returns aggregate market metrics including:
 * - Active device variants
 * - Liquidity distribution
 * - Momentum trends
 * - Confidence metrics
 * - Risk flags (stale anchors, low confidence)
 */

import { NextResponse } from 'next/server';
import {
  getMarketIndicators,
  getRiskControlConfig,
} from '@magnus-flipper-ai/tech-trade-core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface MarketOverviewResponse {
  // Device metrics
  activeVariants: number;
  
  // Liquidity distribution
  liquidity: {
    high: number;
    highPercent: number;
    medium: number;
    mediumPercent: number;
    low: number;
    lowPercent: number;
  };
  
  // Momentum distribution
  momentum: {
    trendingUp: number;
    trendingUpPercent: number;
    trendingDown: number;
    trendingDownPercent: number;
    stable: number;
    stablePercent: number;
  };
  
  // Confidence
  avgConfidence: number;
  confidenceFactors: {
    freshness: number;
    sourceAgreement: number;
    coverage: number;
  };
  
  // Risk flags
  riskFlags: {
    staleAnchors: {
      cex: number;
      backMarket: number;
      total: number;
    };
    lowConfidenceDevices: number;
    pricingHalted: boolean;
    haltReason: string | null;
  };
  
  // Volume metrics
  volume: {
    quotesToday: number;
    quotesThisWeek: number;
    quotesThisMonth: number;
  };
  
  generatedAt: string;
}

export async function GET(): Promise<NextResponse<MarketOverviewResponse>> {
  const indicators = await getMarketIndicators();
  const riskConfig = getRiskControlConfig();
  
  // In production, these would be computed from actual device catalog data
  // For now, use mock values that would be typical for a tech trade platform
  const totalVariants = 1247;
  
  // Simulate liquidity distribution based on confidence
  const confidenceLevel = indicators.confidence.overall;
  const highLiquidity = Math.round(totalVariants * confidenceLevel * 0.5);
  const mediumLiquidity = Math.round(totalVariants * 0.4);
  const lowLiquidity = totalVariants - highLiquidity - mediumLiquidity;
  
  // Simulate momentum distribution based on actual momentum metrics
  const momentumPercent = indicators.momentum.percentChange7d;
  const trendingUp = momentumPercent > 0 
    ? Math.round(totalVariants * Math.min(0.3, Math.abs(momentumPercent) / 100 + 0.1))
    : Math.round(totalVariants * 0.1);
  const trendingDown = momentumPercent < 0
    ? Math.round(totalVariants * Math.min(0.3, Math.abs(momentumPercent) / 100 + 0.1))
    : Math.round(totalVariants * 0.1);
  const stable = totalVariants - trendingUp - trendingDown;
  
  // Count low confidence devices (would be from actual device data)
  const lowConfidenceDevices = Math.round(lowLiquidity * 0.3);
  
  const response: MarketOverviewResponse = {
    activeVariants: totalVariants,
    
    liquidity: {
      high: highLiquidity,
      highPercent: Math.round((highLiquidity / totalVariants) * 100),
      medium: mediumLiquidity,
      mediumPercent: Math.round((mediumLiquidity / totalVariants) * 100),
      low: lowLiquidity,
      lowPercent: Math.round((lowLiquidity / totalVariants) * 100),
    },
    
    momentum: {
      trendingUp,
      trendingUpPercent: Math.round((trendingUp / totalVariants) * 100),
      trendingDown,
      trendingDownPercent: Math.round((trendingDown / totalVariants) * 100),
      stable,
      stablePercent: Math.round((stable / totalVariants) * 100),
    },
    
    avgConfidence: indicators.confidence.overall,
    confidenceFactors: {
      freshness: indicators.confidence.factors.freshness,
      sourceAgreement: indicators.confidence.factors.sourceAgreement,
      coverage: indicators.confidence.factors.coverage,
    },
    
    riskFlags: {
      staleAnchors: {
        cex: indicators.anchors.bySource.cex.stale,
        backMarket: indicators.anchors.bySource.back_market.stale,
        total: indicators.anchors.stale,
      },
      lowConfidenceDevices,
      pricingHalted: riskConfig.pricingHalted,
      haltReason: riskConfig.haltReason || null,
    },
    
    volume: {
      quotesToday: indicators.volume.quotesToday,
      quotesThisWeek: indicators.volume.quotesThisWeek,
      quotesThisMonth: indicators.volume.quotesThisMonth,
    },
    
    generatedAt: indicators.generatedAt.toISOString(),
  };
  
  return NextResponse.json(response);
}

