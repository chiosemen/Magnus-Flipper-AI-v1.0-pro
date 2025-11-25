'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useSavedSearches, usePlan } from '@/lib/queries'
import { PlusCircle } from 'lucide-react'
import { useState } from 'react'
import type { SavedSearch } from '@magnus-flipper-ai/core'
import { SavedSearchTable } from '@/components/searches'

export default function SavedSearchesPage() {
  const { searches, isLoading, update, remove } = useSavedSearches()
  const { limits } = usePlan()
  const [busyId, setBusyId] = useState<string | null>(null)

  const handleToggle = async (search: SavedSearch) => {
    setBusyId(search.id)
    try {
      await update(search.id, { active: !search.active })
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this search?')) return

    setBusyId(id)
    try {
      await remove(id)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Saved Searches</h1>
          <p className="text-muted-foreground">
            Manage your categories, filters, and schedules.
          </p>
        </div>
        <Button asChild>
          <Link href="/searches/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Search
          </Link>
        </Button>
      </div>

      {/* Searches Table */}
      <SavedSearchTable
        searches={searches}
        isLoading={isLoading}
        onToggle={handleToggle}
        onDelete={handleDelete}
        busyId={busyId}
        planLimit={limits?.savedSearches}
        emptyAction={
          <Button asChild>
            <Link href="/searches/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Your First Search
            </Link>
          </Button>
        }
      />
    </div>
  )
}
