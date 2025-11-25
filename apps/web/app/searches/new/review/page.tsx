'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useWizard } from '@/lib/wizard-context'
import { useSavedSearches } from '@/hooks/use-app-api'
import { useToast } from '@/components/ui/toast'
import { ChevronLeft, Check, Loader2 } from 'lucide-react'

export default function ReviewStep() {
  const router = useRouter()
  const { data, resetData } = useWizard()
  const { create } = useSavedSearches()
  const { toast } = useToast()
  const [searchName, setSearchName] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!data.category || !data.manufacturer) {
      router.push('/searches/new/category')
      return
    }

    // Auto-generate search name if empty
    if (!searchName) {
      const parts = [data.manufacturer, data.category]
      if (data.models && data.models.length === 1) {
        parts.unshift(data.models[0])
      } else if (data.models && data.models.length > 1) {
        parts.unshift(`${data.models.length} models`)
      }
      setSearchName(parts.join(' '))
    }
  }, [data, searchName, router])

  if (!data.category || !data.manufacturer) return null

  const handleSubmit = async () => {
    if (!searchName.trim()) {
      toast({
        variant: 'error',
        title: 'Name required',
        description: 'Please enter a name for your search',
      })
      return
    }

    setIsSubmitting(true)
    try {
      await create({
        name: searchName.trim(),
        category: data.category,
        manufacturer: data.manufacturer,
        models: data.models,
        minPrice: data.minPrice,
        maxPrice: data.maxPrice,
        radiusMiles: data.radiusMiles,
        locationCity: data.locationCity,
        conditions: data.conditions,
        sites: data.sites,
        maxResultsPerRun: 50, // Default
        active: true, // Start active by default
      })

      toast({
        variant: 'success',
        title: 'Search created!',
        description: `${searchName} is now monitoring marketplaces`,
      })

      resetData()
      router.push('/searches')
    } catch (error) {
      toast({
        variant: 'error',
        title: 'Failed to create search',
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Review your search</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search Name */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Search Name</label>
            <Input
              type="text"
              placeholder="e.g. iPhone 15 Pro Max - NYC"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Give your search a memorable name
            </p>
          </div>

          {/* Summary Sections */}
          <div className="space-y-4 rounded-lg border border-border/60 bg-muted/20 p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Category</p>
                <p className="text-sm">{data.category}</p>
              </div>
              <Badge variant="outline">Required</Badge>
            </div>

            <div className="flex items-start justify-between border-t border-border/40 pt-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Manufacturer</p>
                <p className="text-sm">{data.manufacturer}</p>
              </div>
              <Badge variant="outline">Required</Badge>
            </div>

            {data.models && data.models.length > 0 && (
              <div className="border-t border-border/40 pt-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Models</p>
                <div className="flex flex-wrap gap-2">
                  {data.models.map((model) => (
                    <Badge key={model} variant="secondary">
                      {model}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {(data.minPrice || data.maxPrice) && (
              <div className="border-t border-border/40 pt-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Price Range</p>
                <p className="text-sm">
                  {data.minPrice ? `$${data.minPrice}` : '$0'} -{' '}
                  {data.maxPrice ? `$${data.maxPrice}` : 'Any'}
                </p>
              </div>
            )}

            {(data.locationCity || data.radiusMiles) && (
              <div className="border-t border-border/40 pt-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Location</p>
                <p className="text-sm">
                  {data.locationCity && <span>{data.locationCity} • </span>}
                  {data.radiusMiles ? `${data.radiusMiles} mile radius` : 'No radius limit'}
                </p>
              </div>
            )}

            {data.conditions && data.conditions.length > 0 && (
              <div className="border-t border-border/40 pt-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Conditions</p>
                <div className="flex flex-wrap gap-2">
                  {data.conditions.map((condition) => (
                    <Badge key={condition} variant="secondary">
                      {condition.toLowerCase().replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {data.sites && data.sites.length > 0 && (
              <div className="border-t border-border/40 pt-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Marketplaces</p>
                <div className="flex flex-wrap gap-2">
                  {data.sites.map((site) => (
                    <Badge key={site} variant="secondary">
                      {site.toLowerCase().replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-cyan-mint/30 bg-cyan-mint/5 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-mint/20">
                <Check className="h-4 w-4 text-cyan-mint" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="font-semibold">Ready to start monitoring</p>
                <p className="text-sm text-muted-foreground">
                  Your search will automatically run every few minutes and notify you of new matches
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          onClick={() => router.push('/searches/new/filters')}
          variant="outline"
          disabled={isSubmitting}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting || !searchName.trim()}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Create Search
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
