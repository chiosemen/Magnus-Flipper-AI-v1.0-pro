"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/flipbomb/ui/card";
import { Badge } from "@/components/flipbomb/ui/badge";
import type { PriceEstimatorProps, PriceEstimate } from "./types";
import type { VehicleCondition } from "@/types/usedCarLead";

/**
 * Calculate estimated retail price based on vehicle details
 * Uses simplified KBB-style depreciation model
 */
function calculateRetailPrice(
  make: string,
  model: string,
  year: number,
  mileage: number,
  condition: VehicleCondition
): number {
  // Base MSRP estimates (simplified - in production, use real data)
  const baseMSRP: Record<string, number> = {
    "Toyota": 35000,
    "Honda": 32000,
    "Ford": 38000,
    "Chevrolet": 36000,
    "Nissan": 30000,
    "BMW": 50000,
    "Mercedes-Benz": 55000,
    "Audi": 48000,
    "Lexus": 45000,
    "Hyundai": 28000,
    "Kia": 27000,
    "Mazda": 29000,
    "Subaru": 33000,
    "Volkswagen": 31000,
    "Jeep": 40000,
  };

  const basePrice = baseMSRP[make] || 35000;

  // Age depreciation (5% per year, max 50%)
  const currentYear = new Date().getFullYear();
  const age = currentYear - year;
  const ageDepreciation = Math.min(age * 0.05, 0.5);

  // Mileage depreciation (standard curve: 12k miles/year baseline)
  const expectedMiles = age * 12000;
  const excessMiles = Math.max(0, mileage - expectedMiles);
  const mileageDepreciation = Math.min(excessMiles / 200000, 0.3);

  // Condition multiplier
  const conditionMultipliers: Record<VehicleCondition, number> = {
    excellent: 1.0,
    good: 0.95,
    fair: 0.85,
    poor: 0.70,
    salvage: 0.40,
  };

  const conditionMultiplier = conditionMultipliers[condition];

  // Calculate final retail price
  const retailPrice =
    basePrice *
    (1 - ageDepreciation - mileageDepreciation) *
    conditionMultiplier;

  return Math.round(Math.max(retailPrice, 1000));
}

/**
 * Calculate dealer offer range
 * Dealers typically offer 75-85% of retail value
 */
function calculateDealerOffer(retailPrice: number): {
  low: number;
  high: number;
} {
  return {
    low: Math.round(retailPrice * 0.75),
    high: Math.round(retailPrice * 0.85),
  };
}

/**
 * Price Estimator Component
 * 
 * Pure calculation component that estimates retail price and dealer offers
 * based on vehicle details. No API calls.
 */
export function PriceEstimator({ formData }: PriceEstimatorProps) {
  const estimate = useMemo<PriceEstimate | null>(() => {
    if (!formData || !formData.make || !formData.model || !formData.year) {
      return undefined as any;
    }

    const estimatedRetail = calculateRetailPrice(
      formData.make,
      formData.model,
      formData.year,
      formData.mileage,
      formData.condition
    );

    const { low, high } = calculateDealerOffer(estimatedRetail);
    const estimatedOfferMid = Math.round((low + high) / 2);
    const priceDelta = estimatedRetail - estimatedOfferMid;

    return {
      estimatedRetail,
      estimatedOfferLow: low,
      estimatedOfferHigh: high,
      estimatedOfferMid,
      priceDelta,
    };
  }, [formData]);

  if (!estimate) {
    return (
      <div className="rounded-md border border-slate-700 bg-slate-900/40 p-4 text-slate-400 text-sm">
        Price estimator unavailable — insufficient vehicle data
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Estimated Value & Dealer Offers</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              Estimated Retail Value
            </p>
            <p className="text-2xl font-bold">{formatCurrency(estimate.estimatedRetail)}</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              Dealer Offer Range
            </p>
            <p className="text-2xl font-bold">
              {formatCurrency(estimate.estimatedOfferLow)} - {formatCurrency(estimate.estimatedOfferHigh)}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              Typical Dealer Offer
            </p>
            <p className="text-2xl font-bold">{formatCurrency(estimate.estimatedOfferMid)}</p>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Price Delta (Retail - Dealer Offer)</p>
            <Badge variant={estimate.priceDelta > 5000 ? "destructive" : "secondary"} className="text-lg px-3 py-1">
              {formatCurrency(estimate.priceDelta)}
            </Badge>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            This is the typical gap between retail value and dealer offers. Magnus Flipper helps you find better deals.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

