import type { Listing } from '@magnus-flipper-ai/core'
import { ListingCard } from './ListingCard'
import { EmptyState } from '../ui/EmptyState'

export function ListingsGrid({ listings }: { listings: Listing[] }) {
  if (!listings?.length) {
    return <EmptyState title="No listings yet" description="Adjust filters or add a saved search." />
  }
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {listings.map((l) => (
        <ListingCard key={l.id} listing={l} />
      ))}
    </div>
  )
}
