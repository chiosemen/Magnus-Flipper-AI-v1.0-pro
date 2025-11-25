'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useSavedSearches } from '@/hooks/use-app-api'
import { formatDistanceToNow } from 'date-fns'
import { Lock, Pause, Play, PlusCircle, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { SavedSearch } from '@magnus-flipper-ai/core'

function summarizeFilters(search: SavedSearch) {
  const parts: string[] = []
  if (search.category) parts.push(search.category)
  if (search.manufacturer) parts.push(search.manufacturer)
  if (search.models?.length) parts.push(search.models.join(', '))
  if (search.minPrice) parts.push(`$${search.minPrice}+`)
  if (search.maxPrice) parts.push(`<$${search.maxPrice}`)
  if (search.radiusMiles) parts.push(`${search.radiusMiles}mi radius`)
  return parts.join(' • ')
}

export default function SavedSearchesPage() {
  const { searches, isLoading, update, remove } = useSavedSearches()
  const [busyId, setBusyId] = useState<string | null>(null)

  const handleToggle = async (search: SavedSearch) => {
    setBusyId(search.id)
    await update(search.id, { active: !search.active })
    setBusyId(null)
  }

  const handleDelete = async (id: string) => {
    setBusyId(id)
    await remove(id)
    setBusyId(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Saved Searches</h1>
          <p className="text-muted-foreground">Manage your categories, filters, and schedules.</p>
        </div>
        <Button asChild>
          <Link href="/saved-searches/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Search
          </Link>
        </Button>
      </div>

      <Card className="neon-glow-hover">
        <CardHeader>
          <CardTitle>Search library</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Filters</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>New matches</TableHead>
              <TableHead>Last run</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Loading saved searches...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && searches.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No saved searches yet. Create one to start monitoring.
                  </TableCell>
                </TableRow>
              )}
              {searches.map((search) => (
                <TableRow key={search.id}>
                  <TableCell className="font-semibold flex items-center gap-2">
                    {search.name}
                    {(searches.length > 10 && searches.indexOf(search) >= 10) && (
                      <Lock className="h-4 w-4 text-yellow-400" />
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {summarizeFilters(search)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={search.active ? 'success' : 'outline'}>
                      {search.active ? 'active' : 'paused'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{(search as any).newMatches ?? 0}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {search.lastRunAt
                      ? `${formatDistanceToNow(new Date(search.lastRunAt))} ago`
                      : 'Not run yet'}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busyId === search.id}
                      onClick={() => handleToggle(search)}
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
                      disabled={busyId === search.id}
                      onClick={() => handleDelete(search.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
