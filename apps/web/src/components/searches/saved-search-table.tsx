import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { SavedSearch } from '@magnus-flipper-ai/core'
import { SavedSearchRow } from './saved-search-row'
import { EmptyState } from '@magnus-flipper-ai/ui'
import { Search } from 'lucide-react'

export interface SavedSearchTableProps {
  searches: SavedSearch[]
  isLoading?: boolean
  onToggle: (search: SavedSearch) => void
  onDelete: (id: string) => void
  busyId?: string | null
  planLimit?: number
  emptyAction?: React.ReactNode
}

/**
 * SavedSearchTable - Table component for displaying saved searches
 * Includes loading, empty states, and plan limit indicators
 */
export function SavedSearchTable({
  searches,
  isLoading,
  onToggle,
  onDelete,
  busyId,
  planLimit,
  emptyAction,
}: SavedSearchTableProps) {
  return (
    <Card className="neon-glow-hover">
      <CardHeader>
        <CardTitle>Search Library</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <EmptyState
            icon={<Search className="h-12 w-12" />}
            title="Loading saved searches..."
            description="Please wait while we fetch your searches."
          />
        ) : searches.length === 0 ? (
          <EmptyState
            icon={<Search className="h-12 w-12" />}
            title="No saved searches yet"
            description="Create your first search to start monitoring marketplace listings."
            action={emptyAction}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Filters</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>New Matches</TableHead>
                <TableHead>Last Run</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {searches.map((search, index) => (
                <SavedSearchRow
                  key={search.id}
                  search={search}
                  onToggle={onToggle}
                  onDelete={onDelete}
                  isLocked={planLimit ? index >= planLimit : false}
                  isBusy={busyId === search.id}
                  newMatches={(search as any).newMatches ?? 0}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
