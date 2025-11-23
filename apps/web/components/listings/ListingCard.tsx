import type { Listing } from '@magnus-flipper-ai/core'
import { Badge } from '../ui/Badge'

export function ListingCard({ listing }: { listing: Listing }) {
  return (
    <div className="rounded-lg border border-[--border] bg-[--surface] p-4 hover:border-[--accent-blue]/60 transition">
      <div className="aspect-video w-full rounded-md bg-gradient-to-br from-[--accent-purple]/10 to-[--accent-blue]/10 mb-3" />
      <div className="space-y-2">
        <p className="line-clamp-2 text-sm font-semibold text-[--foreground]">{listing.title}</p>
        <p className="text-xs text-[--muted-foreground] capitalize">
          {listing.site?.toLowerCase()} • {listing.city || listing.region || 'Unknown'}
        </p>
        <div className="flex items-center justify-between">
          <span className="font-mono text-lg text-[--foreground]">${listing.price}</span>
          <Badge variant="outline">{listing.condition || 'N/A'}</Badge>
        </div>
      </div>
    </div>
  )
}
