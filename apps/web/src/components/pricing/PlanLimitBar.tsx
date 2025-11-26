interface PlanLimitBarProps {
  label: string;
  used: number;
  limit: number;
}

export function PlanLimitBar({ label, used, limit }: PlanLimitBarProps) {
  const percent = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm text-slate-300">
        <span>{label}</span>
        <span className="text-xs text-slate-400">
          {used} / {limit} ({percent}%)
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
