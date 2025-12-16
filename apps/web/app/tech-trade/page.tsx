'use client';

/**
 * Tech Trade - Minimal Internal UI
 * 
 * Route: /tech-trade
 * 
 * This is a minimal, functional UI for internal testing of the Tech Trade
 * quote system. It is NOT production-ready and is clearly labeled as Beta/Internal.
 * 
 * Features:
 * - Device search
 * - Quote request form
 * - Price display with market indicators
 * - Pricing halted warning
 */

import { useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';

// ============================================================================
// Types
// ============================================================================

interface Device {
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
}

interface QuoteResult {
  quote: {
    deviceId: string;
    device: {
      brand: string;
      model: string;
      category: string;
    };
    condition: string;
    attributes: Record<string, string>;
    breakdown: {
      basePrice: number;
      conditionMultiplier: number;
      afterCondition: number;
      attributeAdjustment: number;
      afterAttributes: number;
      anchorBlendedPrice: number | null;
      policyAdjustment: number;
      finalPrice: number;
      pricingFrozen: boolean;
    };
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

type Condition = 'new' | 'excellent' | 'good' | 'fair';

// ============================================================================
// Components
// ============================================================================

function BetaBanner() {
  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-6">
      <div className="flex items-center gap-2">
        <Badge className="bg-amber-500 text-black border-amber-500">
          Beta / Internal
        </Badge>
        <span className="text-amber-200 text-sm">
          This is an internal testing interface. Not for production use.
        </span>
      </div>
    </div>
  );
}

function PricingHaltedWarning({ reason }: { reason?: string }) {
  return (
    <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-3">
        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        <div>
          <h3 className="text-red-400 font-semibold">Pricing Halted</h3>
          <p className="text-red-300/80 text-sm">
            {reason || 'Market pricing is temporarily suspended. Quotes use fallback pricing only.'}
          </p>
        </div>
      </div>
    </div>
  );
}

function LiquidityBadge({ level }: { level: 'high' | 'medium' | 'low' }) {
  const colors = {
    high: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    low: 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  
  return (
    <Badge className={colors[level]}>
      Liquidity: {level.toUpperCase()}
    </Badge>
  );
}

function MomentumBadge({ trend }: { trend: 'up' | 'down' | 'stable' }) {
  const config = {
    up: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: '↑' },
    down: { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: '↓' },
    stable: { color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', icon: '→' },
  };
  
  return (
    <Badge className={config[trend].color}>
      {config[trend].icon} {trend.toUpperCase()}
    </Badge>
  );
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const percent = Math.round(confidence * 100);
  const color = percent >= 70 
    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    : percent >= 40
    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
    : 'bg-red-500/20 text-red-400 border-red-500/30';
  
  return (
    <Badge className={color}>
      Confidence: {percent}%
    </Badge>
  );
}

function DeviceSearchSection({
  onDeviceSelect,
}: {
  onDeviceSelect: (device: Device) => void;
}) {
  const [query, setQuery] = useState('');
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/tech-trade/device-search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (!data.success) {
        setError(data.error || 'Search failed');
        setDevices([]);
      } else {
        setDevices(data.devices);
      }
    } catch (err) {
      setError('Failed to search devices');
      setDevices([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Device Search</CardTitle>
        <CardDescription>Search for a device to get a quote</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Search devices (e.g., iPhone 14, Samsung Galaxy...)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </div>
        
        {error && (
          <div className="text-red-400 text-sm mb-4">{error}</div>
        )}
        
        {devices.length > 0 && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {devices.map((device) => (
              <button
                key={device.id}
                onClick={() => onDeviceSelect(device)}
                className="w-full text-left p-3 rounded-lg border border-slate-700 hover:border-slate-500 hover:bg-slate-800/50 transition-colors"
              >
                <div className="font-medium">{device.brand} {device.model}</div>
                <div className="text-sm text-slate-400">
                  {device.category} • {device.releaseYear} • Base: £{device.basePrice}
                </div>
              </button>
            ))}
          </div>
        )}
        
        {devices.length === 0 && query && !loading && !error && (
          <div className="text-slate-400 text-sm">No devices found. Try a different search term.</div>
        )}
      </CardContent>
    </Card>
  );
}

function QuoteFormSection({
  selectedDevice,
  onQuoteResult,
}: {
  selectedDevice: Device | null;
  onQuoteResult: (result: QuoteResult) => void;
}) {
  const [condition, setCondition] = useState<Condition>('excellent');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGetQuote = useCallback(async () => {
    if (!selectedDevice) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/tech-trade/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: selectedDevice.id,
          condition,
          attributes: {},
          channel: 'b2c',
        }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        setError(data.error || 'Failed to get quote');
      } else {
        onQuoteResult(data);
      }
    } catch (err) {
      setError('Failed to get quote');
    } finally {
      setLoading(false);
    }
  }, [selectedDevice, condition, onQuoteResult]);

  if (!selectedDevice) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Quote Request</CardTitle>
          <CardDescription>Select a device to request a quote</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-slate-400 text-center py-8">
            Search and select a device above to get started
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quote Request</CardTitle>
        <CardDescription>
          Get a quote for {selectedDevice.brand} {selectedDevice.model}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-3 bg-slate-800/50 rounded-lg">
            <div className="font-medium">{selectedDevice.brand} {selectedDevice.model}</div>
            <div className="text-sm text-slate-400">
              Base Price: £{selectedDevice.basePrice}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Condition</label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value as Condition)}
              className="w-full h-10 rounded-md border border-slate-800 bg-slate-950 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              <option value="new">New</option>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
            </select>
          </div>
          
          {error && (
            <div className="text-red-400 text-sm">{error}</div>
          )}
          
          <Button onClick={handleGetQuote} disabled={loading} className="w-full">
            {loading ? 'Getting Quote...' : 'Get Quote'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function QuoteResultSection({ result }: { result: QuoteResult | null }) {
  if (!result) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Quote Result</CardTitle>
          <CardDescription>Your quote will appear here</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-slate-400 text-center py-8">
            Request a quote to see pricing details
          </div>
        </CardContent>
      </Card>
    );
  }

  const { quote, indicators, systemStatus } = result;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quote Result</CardTitle>
        <CardDescription>
          {quote.device.brand} {quote.device.model} • {quote.condition}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {systemStatus.pricingHalted && (
          <PricingHaltedWarning reason={systemStatus.haltReason} />
        )}
        
        {quote.pricingFrozen && !systemStatus.pricingHalted && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-4">
            <span className="text-amber-200 text-sm">
              ⚠️ This quote uses fallback pricing (market signals unavailable)
            </span>
          </div>
        )}
        
        <div className="text-center py-6">
          <div className="text-4xl font-bold text-emerald-400 mb-2">
            £{quote.finalPrice.toFixed(2)}
          </div>
          <div className="text-slate-400 text-sm">
            Estimated trade-in value
          </div>
        </div>
        
        <div className="flex justify-center gap-2 mb-6">
          <LiquidityBadge level={indicators.liquidity} />
          <MomentumBadge trend={indicators.momentum} />
          <ConfidenceBadge confidence={indicators.confidence} />
        </div>
        
        <div className="border-t border-slate-800 pt-4">
          <h4 className="text-sm font-medium mb-3">Price Breakdown</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Base Price</span>
              <span>£{quote.breakdown.basePrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Condition ({quote.condition})</span>
              <span>×{quote.breakdown.conditionMultiplier}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">After Condition</span>
              <span>£{quote.breakdown.afterCondition.toFixed(2)}</span>
            </div>
            {quote.breakdown.attributeAdjustment !== 0 && (
              <div className="flex justify-between">
                <span className="text-slate-400">Attribute Adjustment</span>
                <span className={quote.breakdown.attributeAdjustment > 0 ? 'text-emerald-400' : 'text-red-400'}>
                  {quote.breakdown.attributeAdjustment > 0 ? '+' : ''}£{quote.breakdown.attributeAdjustment.toFixed(2)}
                </span>
              </div>
            )}
            {quote.breakdown.anchorBlendedPrice !== null && (
              <div className="flex justify-between">
                <span className="text-slate-400">Market Anchor Price</span>
                <span>£{quote.breakdown.anchorBlendedPrice.toFixed(2)}</span>
              </div>
            )}
            {quote.breakdown.policyAdjustment !== 0 && (
              <div className="flex justify-between">
                <span className="text-slate-400">Policy Adjustment</span>
                <span className={quote.breakdown.policyAdjustment > 0 ? 'text-emerald-400' : 'text-red-400'}>
                  {quote.breakdown.policyAdjustment > 0 ? '+' : ''}£{quote.breakdown.policyAdjustment.toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between font-medium pt-2 border-t border-slate-800">
              <span>Final Price</span>
              <span className="text-emerald-400">£{quote.breakdown.finalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function TechTradePage() {
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [quoteResult, setQuoteResult] = useState<QuoteResult | null>(null);

  const handleDeviceSelect = useCallback((device: Device) => {
    setSelectedDevice(device);
    setQuoteResult(null); // Clear previous quote when selecting new device
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Tech Trade</h1>
          <p className="text-slate-400">
            Get instant quotes for tech device trade-ins
          </p>
        </div>
        
        <BetaBanner />
        
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-6">
            <DeviceSearchSection onDeviceSelect={handleDeviceSelect} />
            <QuoteFormSection
              selectedDevice={selectedDevice}
              onQuoteResult={setQuoteResult}
            />
          </div>
          
          <div>
            <QuoteResultSection result={quoteResult} />
          </div>
        </div>
      </div>
    </div>
  );
}

