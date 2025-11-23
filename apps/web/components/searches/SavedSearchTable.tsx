import type { SavedSearch } from '@magnus-flipper-ai/core'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

function summarize(search: SavedSearch) {
  const parts = [search.category, search.manufacturer, (search.models || []).join(', ')]
  if (search.minPrice) parts.push(`$${search.minPrice}+`)
  if (search.maxPrice) parts.push(`<$${search.maxPrice}`)
  if (search.radiusMiles) parts.push(`${search.radiusMiles}mi`)
  return parts.filter(Boolean).join(' • ')
}

export function SavedSearchTable({ searches }: { searches: SavedSearch[] }) {
  if (!searches?.length) return <div className="text-sm text-[--muted-foreground]">No saved searches</div>
  return (
    <div className="overflow-hidden rounded-lg border border-[--border] bg-[--surface]">
      <table className="w-full text-sm">
        <thead className="bg-[--muted]">
          <tr>
            <th className="px-4 py-3 text-left">Name</th>
            <th className="px-4 py-3 text-left">Filters</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Last run</th>
            <th className="px-4 py-3 text-left">Matches</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {searches.map((s, idx) => {
            const locked = searches.length > 10 && idx >= 10
            return (
              <tr key={s.id} className="border-t border-[--border]">
                <td className="px-4 py-3 font-semibold text-[--foreground]">{s.name}</td>
                <td className="px-4 py-3 text-[--muted-foreground]">{summarize(s)}</td>
                <td className="px-4 py-3">
                  <Badge variant={s.active ? 'default' : 'outline'}>{s.active ? 'active' : 'paused'}</Badge>
                </td>
                <td className="px-4 py-3 text-[--muted-foreground]">{s.lastRunAt || '—'}</td>
                <td className="px-4 py-3 text-[--muted-foreground]">{(s as any).newMatches ?? 0}</td>
                <td className="px-4 py-3 text-right space-x-2">
                  {locked && <Badge variant="warning">Locked</Badge>}
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm">
                    Delete
                  </Button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
