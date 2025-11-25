'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { CATEGORIES, getManufacturersForCategory } from '@magnus-flipper-ai/ui-config'
import { useListingsFeed } from '@/hooks/use-app-api'
import { formatCurrency } from '@/lib/utils'

export default function ResultsPage() {
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({
    category: '',
    manufacturer: '',
    minPrice: '',
    maxPrice: '',
  })
  const [openFilters, setOpenFilters] = useState(false)

  const manufacturers = useMemo(
    () => (filters.category ? getManufacturersForCategory(filters.category) : []),
    [filters.category]
  )

  const { feed, isLoading, isValidating } = useListingsFeed({
    page,
    pageSize: 12,
    ...filters,
  })

  const totalPages = useMemo(() => {
    if (!feed?.total || !feed?.pageSize) return 1
    return Math.max(1, Math.ceil(feed.total / feed.pageSize))
  }, [feed?.total, feed?.pageSize])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Results</h1>
          <p className="text-muted-foreground">
            Live listing grid from /api/listings/feed with pagination.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary">{isValidating ? 'Syncing…' : 'Live'}</Badge>
          <Button variant="outline" onClick={() => setOpenFilters(true)}>
            Filters
          </Button>
        </div>
      </div>

      {openFilters && (
        <Card className="neon-glow-hover">
          <CardHeader>
            <CardTitle>Filter listings</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Category</label>
              <Select
                value={filters.category}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, category: e.target.value, manufacturer: '' }))
                }
              >
                <option value="">Any</option>
                {CATEGORIES.map((cat: { id: string; label: string }) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Manufacturer</label>
              <Select
                value={filters.manufacturer}
                onChange={(e) => setFilters((prev) => ({ ...prev, manufacturer: e.target.value }))}
              >
                <option value="">Any</option>
                {manufacturers.map((m: { id: string; label: string }) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Min price</label>
              <Input
                type="number"
                value={filters.minPrice}
                onChange={(e) => setFilters((prev) => ({ ...prev, minPrice: e.target.value }))}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Max price</label>
              <Input
                type="number"
                value={filters.maxPrice}
                onChange={(e) => setFilters((prev) => ({ ...prev, maxPrice: e.target.value }))}
                placeholder="2000"
              />
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => setOpenFilters(false)}>
                Close
              </Button>
              <Button onClick={() => setPage(1)}>Apply</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading &&
          [...Array(6)].map((_, idx) => (
            <Card key={idx}>
              <CardContent className="p-4 space-y-3">
                <div className="h-32 rounded-lg bg-muted/40" />
                <div className="h-4 w-3/4 rounded bg-muted/60" />
                <div className="h-3 w-1/2 rounded bg-muted/60" />
              </CardContent>
            </Card>
          ))}
        {feed?.listings?.map((listing) => (
          <Link key={listing.id} href={`/listings/${listing.id}`}>
            <Card className="h-full border-border/60 bg-muted/20 transition hover:border-cyan-mint/60">
              <CardContent className="p-4 space-y-3">
                <div className="aspect-video w-full rounded-lg bg-gradient-to-br from-indigo-blue/20 to-cyan-mint/10" />
                <p className="line-clamp-2 font-semibold">{listing.title}</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {listing.site?.toLowerCase()} • {listing.city || listing.region || 'Unknown'}
                </p>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-lg">{formatCurrency(listing.price)}</span>
                  <Badge variant="outline" className="capitalize">
                    {listing.condition?.toLowerCase() || 'n/a'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <Button variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
          Previous
        </Button>
        <div className="text-sm text-muted-foreground">
          Page {page} / {totalPages}
        </div>
        <Button
          variant="outline"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
