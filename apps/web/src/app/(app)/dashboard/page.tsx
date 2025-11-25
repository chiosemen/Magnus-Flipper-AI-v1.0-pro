'use client'

import { Button } from '@/components/ui/button'
import { PlusCircle } from 'lucide-react'
import { useSavedSearches, useAlerts, useListingsFeed, usePlan } from '@/lib/queries'
import Link from 'next/link'
import {
  PlanSummaryCard,
  RecentAlertsCard,
  QuickActionsCard,
  LatestMatchesCard,
} from '@/components/dashboard'

export default function DashboardPage() {
  const { searches } = useSavedSearches()
  const { stats: alertStats, alerts } = useAlerts()
  const { listings, isLoading: loadingFeed } = useListingsFeed({ page: 1, pageSize: 6 })
  const { plan, usage, limits, isLoading: loadingPlan } = usePlan()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Magnus Marketplace Dashboard</h1>
          <p className="text-muted-foreground">
            Track saved searches, alerts, and fresh flips in one place.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" asChild>
            <Link href="/results">Browse Results</Link>
          </Button>
          <Button asChild>
            <Link href="/searches/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Search
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <PlanSummaryCard
          plan={plan}
          usage={usage}
          limits={limits}
          unreadAlerts={alertStats?.unread ?? 0}
          isLoading={loadingPlan}
        />

        <RecentAlertsCard alerts={alerts} limit={3} />

        <QuickActionsCard searchCount={searches.length} />
      </div>

      {/* Latest Matches */}
      <LatestMatchesCard listings={listings} isLoading={loadingFeed} />
    </div>
  )
}
