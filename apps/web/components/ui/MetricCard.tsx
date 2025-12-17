interface MetricCardProps {
  label: string;
  value: string | number;
  change?: string;
  icon?: string;
  locked?: boolean;
}

export function MetricCard({ label, value, change, icon }: MetricCardProps) {
  const isPositive = change?.startsWith('+');

  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-[#a0a0a0]">{label}</span>
        {icon && <span className="text-2xl">{icon}</span>}
      </div>
      <div className="text-2xl font-bold text-[#ededed] mb-2">{value}</div>
      {change && (
        <div className={`text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
          {change}
        </div>
      )}
    </div>
  );
}
