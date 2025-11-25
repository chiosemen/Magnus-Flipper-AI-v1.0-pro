import { TableCell, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Lock, Pause, Play, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { SavedSearch } from '@magnus-flipper-ai/core'
import { SearchFiltersSummary } from './search-filters-summary'

export interface SavedSearchRowProps {
  search: SavedSearch
  onToggle: (search: SavedSearch) => void
  onDelete: (id: string) => void
  isLocked?: boolean
  isBusy?: boolean
  newMatches?: number
}

/**
 * SavedSearchRow - Individual row in the saved searches table
 * Displays search details and action buttons
 */
export function SavedSearchRow({
  search,
  onToggle,
  onDelete,
  isLocked,
  isBusy,
  newMatches = 0,
}: SavedSearchRowProps) {
  return (
    <TableRow>
      <TableCell className="font-semibold">
        <div className="flex items-center gap-2">
          {search.name}
          {isLocked && (
            <Lock className="h-4 w-4 text-yellow-400" title="Exceeded plan limit" />
          )}
        </div>
      </TableCell>

      <TableCell>
        <SearchFiltersSummary search={search} />
      </TableCell>

      <TableCell>
        <Badge variant={search.active ? 'success' : 'outline'}>
          {search.active ? 'Active' : 'Paused'}
        </Badge>
      </TableCell>

      <TableCell>
        <Badge variant="outline">{newMatches}</Badge>
      </TableCell>

      <TableCell className="text-sm text-muted-foreground">
        {search.lastRunAt
          ? `${formatDistanceToNow(new Date(search.lastRunAt))} ago`
          : 'Not run yet'}
      </TableCell>

      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={isBusy}
            onClick={() => onToggle(search)}
          >
            {search.active ? (
              <>
                <Pause className="mr-2 h-4 w-4" /> Pause
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" /> Resume
              </>
            )}
          </Button>

          <Button
            variant="destructive"
            size="sm"
            disabled={isBusy}
            onClick={() => onDelete(search.id)}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}
