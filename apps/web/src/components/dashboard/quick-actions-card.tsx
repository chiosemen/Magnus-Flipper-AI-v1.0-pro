import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Target, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export interface QuickAction {
  label: string
  href: string
  badge?: string | number
  icon?: React.ReactNode
}

export interface QuickActionsCardProps {
  searchCount?: number
}

/**
 * QuickActionsCard - Displays quick navigation links
 */
export function QuickActionsCard({ searchCount = 0 }: QuickActionsCardProps) {
  const actions: QuickAction[] = [
    {
      label: 'Manage saved searches',
      href: '/searches',
      badge: searchCount,
    },
    {
      label: 'See live results',
      href: '/results',
      icon: <TrendingUp className="h-4 w-4 text-cyan-mint" />,
    },
    {
      label: 'Account settings',
      href: '/settings',
      badge: 'Secure',
    },
  ]

  return (
    <Card className="neon-glow-hover">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-cyan-mint" />
          Quick Links
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-4 py-3 transition hover:border-cyan-mint/60 hover:bg-muted/50"
          >
            <span className="text-sm">{action.label}</span>
            {action.icon ? (
              action.icon
            ) : action.badge !== undefined ? (
              <Badge variant="outline">{action.badge}</Badge>
            ) : null}
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}
