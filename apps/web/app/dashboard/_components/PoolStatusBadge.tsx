import { Badge } from "@/components/ui/badge";

export type PoolHealthStatus = "healthy" | "degraded" | "stale";

interface PoolStatusBadgeProps {
  status: PoolHealthStatus;
}

/**
 * PoolStatusBadge - Visual indicator for pool health status
 *
 * Status logic:
 * - Healthy: last_scrape < 15 min AND stale < 20%
 * - Degraded: last_scrape < 1 hr OR stale 20–50%
 * - Stale: last_scrape > 1 hr OR stale > 50%
 *
 * Read-only component with no mutations or side effects.
 */
export function PoolStatusBadge({ status }: PoolStatusBadgeProps) {
  const config = {
    healthy: {
      label: "Healthy",
      className: "bg-green-500/20 text-green-400 border-green-500/30",
      icon: "✓",
    },
    degraded: {
      label: "Degraded",
      className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      icon: "⚠",
    },
    stale: {
      label: "Stale",
      className: "bg-red-500/20 text-red-400 border-red-500/30",
      icon: "✗",
    },
  };

  const { label, className, icon } = config[status];

  return (
    <Badge className={className}>
      {icon} {label}
    </Badge>
  );
}
