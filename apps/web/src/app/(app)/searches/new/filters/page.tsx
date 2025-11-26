'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useWizard } from '@/lib/wizard-context'
import { ChevronLeft, ChevronRight, CheckSquare, Square } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Condition, MarketplaceSite } from '@magnus-flipper-ai/core'

const CONDITIONS: Condition[] = ['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR']
const MARKETPLACES: MarketplaceSite[] = ['FB_MARKETPLACE', 'CRAIGSLIST', 'OFFERUP', 'VINTED']

const conditionLabels: Record<Condition, string> = {
  NEW: 'New',
  LIKE_NEW: 'Like New',
  GOOD: 'Good',
  FAIR: 'Fair',
  POOR: 'Poor',
}

const marketplaceLabels: Record<MarketplaceSite, string> = {
  FB_MARKETPLACE: 'Facebook Marketplace',
  CRAIGSLIST: 'Craigslist',
  OFFERUP: 'OfferUp',
  VINTED: 'Vinted',
}

export default function FiltersStep() {
  const router = useRouter()
  const { data, updateData } = useWizard()

  const [minPrice, setMinPrice] = useState<string>(data.minPrice?.toString() || '')
  const [maxPrice, setMaxPrice] = useState<string>(data.maxPrice?.toString() || '')
  const [radiusMiles, setRadiusMiles] = useState<string>(data.radiusMiles?.toString() || '25')
  const [locationCity, setLocationCity] = useState<string>(data.locationCity || '')
  const [conditions, setConditions] = useState<Condition[]>(data.conditions || [])
  const [sites, setSites] = useState<MarketplaceSite[]>(data.sites || [])

  useEffect(() => {
    if (!data.category || !data.manufacturer) {
      router.push('/searches/new/category')
    }
  }, [data.category, data.manufacturer, router])

  if (!data.category || !data.manufacturer) return null

  const handleToggleCondition = (condition: Condition) => {
    setConditions((prev) =>
      prev.includes(condition) ? prev.filter((c) => c !== condition) : [...prev, condition]
    )
  }

  const handleToggleSite = (site: MarketplaceSite) => {
    setSites((prev) =>
      prev.includes(site) ? prev.filter((s) => s !== site) : [...prev, site]
    )
  }

  const handleContinue = () => {
    updateData({
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      radiusMiles: radiusMiles ? parseInt(radiusMiles) : undefined,
      locationCity: locationCity || undefined,
      conditions: conditions.length > 0 ? conditions : undefined,
      sites: sites.length > 0 ? sites : undefined,
    })
    router.push('/searches/new/review')
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Set your filters</h2>
            <div className="flex gap-2">
              <Badge variant="outline">{data.category}</Badge>
              <Badge variant="outline">{data.manufacturer}</Badge>
            </div>
          </div>

          {/* Price Range */}
          <div className="space-y-3">
            <label className="text-sm font-semibold">Price Range</label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Min Price ($)</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Max Price ($)</label>
                <Input
                  type="number"
                  placeholder="Any"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Location & Radius */}
          <div className="space-y-3">
            <label className="text-sm font-semibold">Location</label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">City (optional)</label>
                <Input
                  type="text"
                  placeholder="e.g. New York"
                  value={locationCity}
                  onChange={(e) => setLocationCity(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Radius (miles)</label>
                <Input
                  type="number"
                  placeholder="25"
                  value={radiusMiles}
                  onChange={(e) => setRadiusMiles(e.target.value)}
                  min="1"
                  max="500"
                />
              </div>
            </div>
          </div>

          {/* Condition */}
          <div className="space-y-3">
            <label className="text-sm font-semibold">Condition</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {CONDITIONS.map((condition) => {
                const isSelected = conditions.includes(condition)
                return (
                  <button
                    key={condition}
                    onClick={() => handleToggleCondition(condition)}
                    className={cn(
                      'flex items-center gap-2 rounded-lg border px-4 py-3 text-sm transition-all',
                      isSelected
                        ? 'border-cyan-mint/60 bg-cyan-mint/10'
                        : 'border-border/60 bg-muted/20 hover:border-cyan-mint/40'
                    )}
                  >
                    {isSelected ? (
                      <CheckSquare className="h-4 w-4 text-cyan-mint" />
                    ) : (
                      <Square className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span>{conditionLabels[condition]}</span>
                  </button>
                )
              })}
            </div>
            {conditions.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No conditions selected will search all conditions
              </p>
            )}
          </div>

          {/* Marketplaces */}
          <div className="space-y-3">
            <label className="text-sm font-semibold">Marketplaces</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {MARKETPLACES.map((site) => {
                const isSelected = sites.includes(site)
                return (
                  <button
                    key={site}
                    onClick={() => handleToggleSite(site)}
                    className={cn(
                      'flex items-center gap-2 rounded-lg border px-4 py-3 text-sm transition-all',
                      isSelected
                        ? 'border-cyan-mint/60 bg-cyan-mint/10'
                        : 'border-border/60 bg-muted/20 hover:border-cyan-mint/40'
                    )}
                  >
                    {isSelected ? (
                      <CheckSquare className="h-4 w-4 text-cyan-mint" />
                    ) : (
                      <Square className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span>{marketplaceLabels[site]}</span>
                  </button>
                )
              })}
            </div>
            {sites.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No marketplaces selected will search all marketplaces
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button onClick={() => router.push('/searches/new/models')} variant="outline">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={handleContinue}>
          Continue
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
