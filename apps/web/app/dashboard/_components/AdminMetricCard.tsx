interface AdminMetricCardProps {
  label: string;
  value: string | number;
  icon: string;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

/**
 * AdminMetricCard - Read-only metric display for admin dashboard
 *
 * This component displays pooled-only metrics with no mutations or triggers.
 * All data is fetched server-side before rendering.
 */
export function AdminMetricCard({
  label,
  value,
  icon,
  subtitle,
  trend,
}: AdminMetricCardProps) {
  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-[#6E7681] uppercase tracking-wide">{label}</span>
        <span className="text-2xl">{icon}</span>
      </div>

      <div className="text-3xl font-bold text-[#ededed] mb-2">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>

      {subtitle && (
        <div className="text-xs text-[#6E7681]">{subtitle}</div>
      )}

      {trend && (
        <div className={`text-xs mt-2 ${trend.isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {trend.value}
        </div>
      )}
    </div>
  );
}
