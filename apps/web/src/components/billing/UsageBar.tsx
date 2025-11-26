import { Progress } from "@/components/ui/progress";
import { formatNumber } from "@/lib/utils";

interface UsageBarProps {
  label: string;
  used: number;
  limit: number;
}

export function UsageBar({ label, used, limit }: UsageBarProps) {
  const pct = Math.min(100, Math.round((used / Math.max(1, limit)) * 100));
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span>
          {formatNumber(used)} / {formatNumber(limit)}
        </span>
      </div>
      <Progress value={pct} className="h-2" />
    </div>
  );
}
