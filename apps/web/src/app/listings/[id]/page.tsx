'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useListing } from '@/hooks/use-app-api'
import { formatDistanceToNow } from 'date-fns'
import { formatCurrency } from '@/lib/utils'
import { ExternalLink, ArrowLeft, MapPin, Calendar, Package, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export default function ListingDetailPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const { listing, isLoading } = useListing(params.id)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="aspect-video w-full rounded-lg" />
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-20 w-20 rounded-lg" />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!listing) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <p className="text-muted-foreground mb-4">Listing not found</p>
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </CardContent>
      </Card>
    )
  }

  const images = listing.imageUrls && listing.imageUrls.length > 0 ? listing.imageUrls : []
  const currentImage = images[selectedImageIndex]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            size="sm"
            className="mb-2 -ml-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="capitalize">
              {listing.site?.toLowerCase().replace('_', ' ')}
            </Badge>
            {listing.condition && (
              <Badge variant="outline" className="capitalize">
                {listing.condition.toLowerCase().replace('_', ' ')}
              </Badge>
            )}
          </div>
          <h1 className="text-3xl font-bold mb-2">{listing.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {listing.city && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{listing.city}{listing.region && `, ${listing.region}`}</span>
              </div>
            )}
            {listing.postedAt && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Posted {formatDistanceToNow(new Date(listing.postedAt), { addSuffix: true })}</span>
              </div>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground mb-1">Price</p>
          <p className="text-3xl font-bold font-mono">{formatCurrency(listing.price)}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Images & Description */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {/* Main Image */}
              <div className="relative aspect-video bg-gradient-to-br from-indigo-blue/20 to-cyan-mint/10">
                {currentImage ? (
                  <img
                    src={currentImage}
                    alt={listing.title}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Package className="h-24 w-24 text-muted-foreground" />
                  </div>
                )}

                {/* Image Navigation */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 backdrop-blur-sm transition hover:bg-black/80"
                    >
                      <ChevronLeft className="h-6 w-6 text-white" />
                    </button>
                    <button
                      onClick={() => setSelectedImageIndex((prev) => (prev + 1) % images.length)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 backdrop-blur-sm transition hover:bg-black/80"
                    >
                      <ChevronRight className="h-6 w-6 text-white" />
                    </button>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-sm text-white backdrop-blur-sm">
                      {selectedImageIndex + 1} / {images.length}
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnail Gallery */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto p-4">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`flex-shrink-0 rounded-lg border-2 transition-all ${
                        selectedImageIndex === index
                          ? 'border-cyan-mint'
                          : 'border-border hover:border-cyan-mint/50'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${listing.title} ${index + 1}`}
                        className="h-20 w-20 rounded-lg object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Description */}
          {listing.description && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {listing.description}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Details Sidebar */}
        <div className="space-y-4">
          {/* Key Details */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {listing.manufacturer && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Manufacturer</span>
                  <span className="font-semibold">{listing.manufacturer}</span>
                </div>
              )}
              {listing.model && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Model</span>
                  <span className="font-semibold">{listing.model}</span>
                </div>
              )}
              {listing.condition && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Condition</span>
                  <Badge variant="outline" className="capitalize">
                    {listing.condition.toLowerCase().replace('_', ' ')}
                  </Badge>
                </div>
              )}
              <div className="border-t border-border/50 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Price</span>
                  <span className="text-2xl font-bold font-mono">
                    {formatCurrency(listing.price)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <Button asChild className="w-full" size="lg">
                <a href={listing.url} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 h-5 w-5" />
                  View on {listing.site?.toLowerCase().replace('_', ' ')}
                </a>
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Opens original listing in new tab
              </p>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Listing Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Listing ID</span>
                <span className="font-mono text-xs">{listing.externalId}</span>
              </div>
              {listing.scrapedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discovered</span>
                  <span>{formatDistanceToNow(new Date(listing.scrapedAt), { addSuffix: true })}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
