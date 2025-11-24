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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useSavedSearches } from '@/hooks/use-app-api'
import { usePlan } from '@/hooks/use-plan'
import { useToast } from '@/components/ui/toast'
import { formatDistanceToNow } from 'date-fns'
import { Lock, Pause, Play, PlusCircle, Trash2, Edit, AlertCircle, Zap } from 'lucide-react'
import { useState } from 'react'
import type { SavedSearch } from '@magnus-flipper-ai/core'
import { Skeleton } from '@/components/ui/skeleton'

function summarizeFilters(search: SavedSearch) {
  const parts: string[] = []
  if (search.minPrice || search.maxPrice) {
    if (search.minPrice && search.maxPrice) {
      parts.push(`$${search.minPrice}-$${search.maxPrice}`)
    } else if (search.minPrice) {
      parts.push(`$${search.minPrice}+`)
    } else if (search.maxPrice) {
      parts.push(`<$${search.maxPrice}`)
    }
  }
  if (search.radiusMiles) parts.push(`${search.radiusMiles}mi`)
  if (search.conditions?.length) parts.push(search.conditions.map(c => c.toLowerCase()).join(', '))
  if (search.sites?.length) parts.push(search.sites.map(s => s.toLowerCase()).join(', '))
  return parts.length > 0 ? parts.join(' • ') : 'No filters'
}

function getCategoryDisplay(search: SavedSearch) {
  const parts: string[] = []
  if (search.category) parts.push(search.category)
  if (search.manufacturer) parts.push(search.manufacturer)
  if (search.models?.length) {
    if (search.models.length <= 2) {
      parts.push(search.models.join(', '))
    } else {
      parts.push(`${search.models.length} models`)
    }
  }
  return parts.join(' • ')
}

export default function SearchesPage() {
  const { searches, isLoading, update, remove } = useSavedSearches()
  const { plan, limits, usage } = usePlan()
  const { toast } = useToast()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null)

  const atLimit = usage && limits && usage.savedSearches >= limits.maxSavedSearches

  const handleToggle = async (search: SavedSearch) => {
    setBusyId(search.id)
    try {
      await update(search.id, { active: !search.active })
      toast({
        variant: 'success',
        title: search.active ? 'Search paused' : 'Search resumed',
        description: `${search.name} is now ${search.active ? 'paused' : 'active'}`,
      })
    } catch (error) {
      toast({
        variant: 'error',
        title: 'Failed to update search',
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (id: string) => {
    setBusyId(id)
    try {
      await remove(id)
      toast({
        variant: 'success',
        title: 'Search deleted',
        description: 'Your saved search has been removed',
      })
    } catch (error) {
      toast({
        variant: 'error',
        title: 'Failed to delete search',
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setBusyId(null)
      setDeleteDialog(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Saved Searches</h1>
          <p className="text-muted-foreground">
            Manage your marketplace searches and alerts
            {usage && limits && (
              <span className="ml-2">
                • {usage.savedSearches} / {limits.maxSavedSearches} searches
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-3">
          {atLimit && (
            <Button variant="outline" asChild>
              <Link href="/billing">
                <Zap className="mr-2 h-4 w-4" />
                Upgrade Plan
              </Link>
            </Button>
          )}
          <Button asChild disabled={atLimit}>
            <Link href="/searches/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Search
            </Link>
          </Button>
        </div>
      </div>

      {atLimit && (
        <Card className="border-yellow-500/50 bg-yellow-950/20">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-yellow-400" />
            <div className="flex-1">
              <p className="font-semibold">Search limit reached</p>
              <p className="text-sm text-muted-foreground">
                You've reached your plan limit. Upgrade to create more searches.
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/billing">Upgrade</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="neon-glow-hover">
        <CardHeader>
          <CardTitle>Your Searches</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : searches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <PlusCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No searches yet</h3>
              <p className="text-muted-foreground mb-4 max-w-sm">
                Create your first search to start monitoring marketplaces for flips
              </p>
              <Button asChild>
                <Link href="/searches/new">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Your First Search
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Filters</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Run</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {searches.map((search) => (
                  <TableRow key={search.id}>
                    <TableCell className="font-semibold">
                      {search.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {getCategoryDisplay(search)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {summarizeFilters(search)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={search.active ? 'default' : 'outline'}>
                        {search.active ? 'Active' : 'Paused'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {search.lastRunAt
                        ? formatDistanceToNow(new Date(search.lastRunAt), { addSuffix: true })
                        : 'Never'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={busyId === search.id}
                          onClick={() => handleToggle(search)}
                          title={search.active ? 'Pause search' : 'Resume search'}
                        >
                          {search.active ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={busyId === search.id}
                          onClick={() => setDeleteDialog(search.id)}
                          title="Delete search"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!deleteDialog} onOpenChange={(open) => !open && setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete saved search?</DialogTitle>
            <DialogDescription>
              This will permanently delete this search and you won't receive alerts for it anymore.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteDialog && handleDelete(deleteDialog)}
              disabled={!!busyId}
            >
              Delete Search
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
