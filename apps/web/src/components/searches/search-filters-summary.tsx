import type { SavedSearch } from '@magnus-flipper-ai/core'

export interface SearchFiltersSummaryProps {
  search: SavedSearch
  className?: string
}

/**
 * SearchFiltersSummary - Displays a human-readable summary of search filters
 */
export function SearchFiltersSummary({ search, className }: SearchFiltersSummaryProps) {
  const parts: string[] = []

  if (search.category) parts.push(search.category)
  if (search.manufacturer) parts.push(search.manufacturer)
  if (search.models?.length) {
    const modelsStr = search.models.slice(0, 2).join(', ')
    parts.push(search.models.length > 2 ? `${modelsStr}, +${search.models.length - 2}` : modelsStr)
  }
  if (search.minPrice) parts.push(`$${search.minPrice}+`)
  if (search.maxPrice) parts.push(`<$${search.maxPrice}`)
  if (search.radiusMiles) parts.push(`${search.radiusMiles}mi radius`)
  if (search.condition) parts.push(search.condition.toLowerCase())

  return (
    <span className={`text-sm text-muted-foreground ${className || ''}`}>
      {parts.length > 0 ? parts.join(' • ') : 'No filters set'}
    </span>
  )
}
