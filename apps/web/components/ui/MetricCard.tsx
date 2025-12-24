interface MetricCardProps {
  label: string;
  value: string | number;
  change?: string;
  icon?: string;
  locked?: boolean;
  subtitle?: string;
}

export function MetricCard({ label, value, change, icon, subtitle }: MetricCardProps) {
  const isPositive = change?.startsWith('+');

  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#3a3a3a] rounded-lg p-5 transition-smooth hover-lift">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-[#a0a0a0] uppercase tracking-wide font-medium">{label}</span>
        {icon && <span className="text-xl opacity-80">{icon}</span>}
      </div>
      <div className="text-2xl font-bold text-[#ededed] mb-1">{value}</div>
      {subtitle && (
        <div className="text-xs text-[#6E7681] mt-1">{subtitle}</div>
      )}
      {change && (
        <div className={`text-xs font-medium mt-2 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
          {change}
        </div>
      )}
    </div>
  );
}
