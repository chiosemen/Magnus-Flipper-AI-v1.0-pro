"use client";

import { useState } from "react";
import { Card } from "@/marketing-swoopa/components/ui/card";
import { Input } from "@/marketing-swoopa/components/ui/input";
import { Button } from "@/marketing-swoopa/components/ui/button";

/**
 * ProfitCalculator - UI shell for profit calculation
 * Basic form inputs and display (no heavy logic yet)
 * Uses design tokens for styling
 */
export function ProfitCalculator() {
  const [buyPrice, setBuyPrice] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [fees, setFees] = useState("");

  const buyPriceNum = parseFloat(buyPrice) || 0;
  const sellPriceNum = parseFloat(sellPrice) || 0;
  const feesNum = parseFloat(fees) || 0;

  const grossProfit = sellPriceNum - buyPriceNum;
  const netProfit = grossProfit - feesNum;
  // Margin: profit as percentage of buy price (how much profit relative to purchase cost)
  const margin = buyPriceNum > 0 ? ((netProfit / buyPriceNum) * 100).toFixed(2) : "0.00";
  // ROI: return on investment as percentage of sell price (how much profit relative to sale)
  const roi = sellPriceNum > 0 ? ((netProfit / sellPriceNum) * 100).toFixed(2) : "0.00";
  const hasInput = buyPrice !== "" || sellPrice !== "" || fees !== "";

  const formatCurrency = (value: number) => {
    const absolute = Math.abs(value).toFixed(2);
    return value < 0 ? `-£${absolute}` : `£${absolute}`;
  };

  return (
    <Card className="p-6">
      <h2 className="text-h3 font-heading font-semibold text-foreground mb-6">
        Profit Calculator
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="space-y-4">
          <div>
            <label htmlFor="buy-price" className="text-body-s text-text-secondary mb-2 block">
              Buy Price
            </label>
            <Input
              id="buy-price"
              type="number"
              value={buyPrice}
              onChange={(e) => setBuyPrice(e.target.value)}
              placeholder="0.00"
              className="w-full"
            />
          </div>

          <div>
            <label htmlFor="sell-price" className="text-body-s text-text-secondary mb-2 block">
              Sell Price
            </label>
            <Input
              id="sell-price"
              type="number"
              value={sellPrice}
              onChange={(e) => setSellPrice(e.target.value)}
              placeholder="0.00"
              className="w-full"
            />
          </div>

          <div>
            <label htmlFor="fees" className="text-body-s text-text-secondary mb-2 block">
              Fees & Costs
            </label>
            <Input
              id="fees"
              type="number"
              value={fees}
              onChange={(e) => setFees(e.target.value)}
              placeholder="0.00"
              className="w-full"
            />
          </div>

          <Button variant="default" className="w-full">
            Calculate
          </Button>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <div className="p-4 bg-surfaceSubtle rounded-md">
            <div className="text-body-s text-text-secondary mb-1">Gross Profit</div>
            <div className="text-h2 font-bold text-foreground">
              {formatCurrency(grossProfit)}
            </div>
          </div>

          <div className="p-4 bg-surfaceSubtle rounded-md">
            <div className="text-body-s text-text-secondary mb-1">Net Profit</div>
            <div
              className={`text-h2 font-bold ${
                netProfit >= 0 ? "text-success" : "text-destructive"
              }`}
            >
              {hasInput ? formatCurrency(netProfit) : "—"}
            </div>
          </div>

          <div className="p-4 bg-surfaceSubtle rounded-md">
            <div className="text-body-s text-text-secondary mb-1">Margin</div>
            <div
              className={`text-h2 font-bold ${
                parseFloat(margin) >= 0 ? "text-success" : "text-destructive"
              }`}
            >
              {margin}%
            </div>
          </div>

          <div className="p-4 bg-surfaceSubtle rounded-md">
            <div className="text-body-s text-text-secondary mb-1">ROI</div>
            <div
              className={`text-h2 font-bold ${
                parseFloat(roi) >= 0 ? "text-success" : "text-destructive"
              }`}
            >
              {roi}%
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
